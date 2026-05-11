"""add user avatar_path

Revision ID: 9c42bcd130fa
Revises: 4bb7abc9298c
Create Date: 2026-05-11 22:38:23.565298

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "9c42bcd130fa"
down_revision: str | None = "4bb7abc9298c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_path", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_path")
