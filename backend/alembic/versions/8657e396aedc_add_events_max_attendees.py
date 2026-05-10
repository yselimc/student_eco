"""add events.max_attendees

Revision ID: 8657e396aedc
Revises: ff543e215d3a
Create Date: 2026-05-10 23:39:04.023330

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '8657e396aedc'
down_revision: str | None = 'ff543e215d3a'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('events', sa.Column('max_attendees', sa.Integer(), nullable=True))
    op.create_check_constraint(
        'ck_events_max_attendees_positive',
        'events',
        'max_attendees IS NULL OR max_attendees >= 1',
    )


def downgrade() -> None:
    op.drop_constraint('ck_events_max_attendees_positive', 'events', type_='check')
    op.drop_column('events', 'max_attendees')
