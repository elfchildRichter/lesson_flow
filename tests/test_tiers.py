from app.tiers import get_tier_config, TIER_CONFIGS
from app.workflows.router import company_router


def test_get_tier_config():
    trial = get_tier_config("teacher_trial")
    assert trial["daily_credits"] == 100
    assert trial["enable_web_search"] is False

    pro = get_tier_config("teacher_pro")
    assert pro["daily_credits"] == 1000
    assert pro["enable_web_search"] is True

    admin = get_tier_config(role="admin")
    assert admin["is_unlimited"] is True
    assert "devops" in admin["allowed_departments"]


def test_router_tier_permission_check():
    # 1. Trial user attempting marketing query (now allowed for all tiers)
    state_mkt_trial = company_router.invoke({
        "input_query": "社群推廣文案產出",
        "payload": {
            "query": "社群推廣文案產出",
            "user_info": {
                "role": "user",
                "tier": get_tier_config("teacher_trial", "user")
            }
        }
    })
    res_mkt_trial = state_mkt_trial.get("result", {})
    assert res_mkt_trial.get("status") == "success"

    # 2. Trial user attempting operations query (now allowed for all tiers)
    state_ops_trial = company_router.invoke({
        "input_query": "查詢學校與機構團體授權合約",
        "payload": {
            "query": "查詢學校與機構團體授權合約",
            "user_info": {
                "role": "user",
                "tier": get_tier_config("teacher_trial", "user")
            }
        }
    })
    res_ops_trial = state_ops_trial.get("result", {})
    assert res_ops_trial.get("status") == "success"

    # 3. Non-admin attempting devops query (forbidden for non-admin)
    state_trial_devops = company_router.invoke({
        "input_query": "排查 Railway OOM 記憶體溢出",
        "payload": {
            "query": "排查 Railway OOM 記憶體溢出",
            "user_info": {
                "role": "user",
                "tier": get_tier_config("teacher_trial", "user")
            }
        }
    })
    res_trial_devops = state_trial_devops.get("result", {})
    assert res_trial_devops.get("status") == "forbidden"
    assert "權限限制" in res_trial_devops.get("data", {}).get("output_text", "")

    # 4. Admin user attempting devops query (success)
    state_admin = company_router.invoke({
        "input_query": "排查 Railway OOM 記憶體溢出",
        "payload": {
            "query": "排查 Railway OOM 記憶體溢出",
            "user_info": {
                "role": "admin",
                "tier": get_tier_config("admin", "admin")
            }
        }
    })
    res_admin = state_admin.get("result", {})
    assert res_admin.get("status") == "success"
    assert "Lesson Flow 技術維修" in res_admin.get("data", {}).get("output_text", "")


def test_quota_rollback():
    from app.main import rollback_user_quota
    import sqlite3
    import os
    import datetime

    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    today_str = datetime.date.today().isoformat()

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        # Reset test record
        cursor.execute("DELETE FROM daily_quotas WHERE user_id = 'test_user_rb'")
        cursor.execute(
            "INSERT INTO daily_quotas (user_id, action, usage_date, used_count, daily_limit) VALUES (?, 'credits', ?, ?, ?)",
            ("test_user_rb", today_str, 50, 100)
        )
        conn.commit()

        # Initial check
        cursor.execute(
            "SELECT used_count FROM daily_quotas WHERE user_id = ? AND action = 'credits' AND usage_date = ?",
            ("test_user_rb", today_str)
        )
        assert cursor.fetchone()[0] == 50

        # Rollback deck action (costs 50 credits)
        rollback_user_quota("test_user_rb", "deck")

        # Decremented to 0
        cursor.execute(
            "SELECT used_count FROM daily_quotas WHERE user_id = ? AND action = 'credits' AND usage_date = ?",
            ("test_user_rb", today_str)
        )
        assert cursor.fetchone()[0] == 0

        # Rollback again -> remains 0 (bounded by MAX(0, ...))
        rollback_user_quota("test_user_rb", "deck")
        cursor.execute(
            "SELECT used_count FROM daily_quotas WHERE user_id = ? AND action = 'credits' AND usage_date = ?",
            ("test_user_rb", today_str)
        )
        assert cursor.fetchone()[0] == 0

        # Cleanup
        cursor.execute("DELETE FROM daily_quotas WHERE user_id = 'test_user_rb'")
        conn.commit()


def test_parse_and_vlm_credit_costs():
    from app.tiers import ACTION_CREDIT_COSTS
    from app.main import rollback_user_quota
    import sqlite3
    import os
    import datetime

    assert ACTION_CREDIT_COSTS["parse"] == 5
    assert ACTION_CREDIT_COSTS["refine"] == 3
    assert ACTION_CREDIT_COSTS["vlm_parse"] == 30

    db_path = os.getenv("AUTH_DB_PATH", "./data/users.db")
    today_str = datetime.date.today().isoformat()

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM daily_quotas WHERE user_id = 'test_user_parse_rb'")
        cursor.execute(
            "INSERT INTO daily_quotas (user_id, action, usage_date, used_count, daily_limit) VALUES (?, 'credits', ?, 50, 100)",
            ("test_user_parse_rb", today_str)
        )
        conn.commit()

        # Rollback vlm_parse (30 credits) -> 50 - 30 = 20
        rollback_user_quota("test_user_parse_rb", "vlm_parse")
        cursor.execute(
            "SELECT used_count FROM daily_quotas WHERE user_id = ? AND action = 'credits' AND usage_date = ?",
            ("test_user_parse_rb", today_str)
        )
        assert cursor.fetchone()[0] == 20

        # Rollback refine (3 credits) -> 20 - 3 = 17
        rollback_user_quota("test_user_parse_rb", "refine")
        cursor.execute(
            "SELECT used_count FROM daily_quotas WHERE user_id = ? AND action = 'credits' AND usage_date = ?",
            ("test_user_parse_rb", today_str)
        )
        assert cursor.fetchone()[0] == 17

        # Rollback parse (5 credits) -> 17 - 5 = 12
        rollback_user_quota("test_user_parse_rb", "parse")
        cursor.execute(
            "SELECT used_count FROM daily_quotas WHERE user_id = ? AND action = 'credits' AND usage_date = ?",
            ("test_user_parse_rb", today_str)
        )
        assert cursor.fetchone()[0] == 12

        cursor.execute("DELETE FROM daily_quotas WHERE user_id = 'test_user_parse_rb'")
        conn.commit()





