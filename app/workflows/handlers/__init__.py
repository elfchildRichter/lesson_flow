from app.workflows.handlers.academic import academic_handler
from app.workflows.handlers.devops import devops_handler
from app.workflows.handlers.marketing import marketing_handler
from app.workflows.handlers.operations import operations_handler

__all__ = [
    "academic_handler",
    "operations_handler",
    "devops_handler",
    "marketing_handler",
]
