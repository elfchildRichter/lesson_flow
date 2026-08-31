from app.tiers import get_tier_config, TIER_CONFIGS
from app.workflows.router import company_router


def test_get_tier_config():
    trial = get_tier_config("teacher_trial")
    assert trial["deck_daily_limit"] == 1
    assert trial["ask_daily_limit"] == 5
    assert trial["enable_web_search"] is False

    pro = get_tier_config("teacher_pro")
    assert pro["deck_daily_limit"] == 10
    assert pro["ask_daily_limit"] == 50
    assert pro["enable_web_search"] is True

    admin = get_tier_config(role="admin")
    assert admin["is_unlimited"] is True
    assert "devops" in admin["allowed_departments"]


def test_router_tier_permission_check():
    # Test Guest / Trial user attempting devops query (should be forbidden for non-admin)
    state_trial = company_router.invoke({
        "input_query": "排查 Railway OOM 記憶體溢出",
        "payload": {
            "query": "排查 Railway OOM 記憶體溢出",
            "user_info": {
                "role": "guest",
                "tier": get_tier_config("teacher_trial", "guest")
            }
        }
    })
    res_trial = state_trial.get("result", {})
    assert res_trial.get("status") == "forbidden"
    assert "權限限制" in res_trial.get("data", {}).get("output_text", "")

    # Test Guest / Trial user attempting marketing query (allowed for trial users)
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

    # Test Guest / Trial user attempting operations query (allowed for trial users)
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

    # Test Admin user attempting devops query
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
