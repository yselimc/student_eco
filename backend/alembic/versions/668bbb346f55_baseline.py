"""baseline

Revision ID: 668bbb346f55
Revises:
Create Date: 2026-05-06 12:58:40.446926

"""

from collections.abc import Sequence

revision: str = "668bbb346f55"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
