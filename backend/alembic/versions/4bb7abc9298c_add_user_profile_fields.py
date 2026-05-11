"""add user profile fields

Revision ID: 4bb7abc9298c
Revises: 126e74612131
Create Date: 2026-05-11 22:17:02.733600

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "4bb7abc9298c"
down_revision: str | None = "126e74612131"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("university", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(length=100), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "updated_at")
    op.drop_column("users", "department")
    op.drop_column("users", "university")
