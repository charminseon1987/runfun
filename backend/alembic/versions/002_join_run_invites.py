"""add join run invites table

Revision ID: 002
Revises: 001
Create Date: 2026-04-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "join_run_invites",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("inviter_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("invited_friend_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("runner_session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["inviter_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["invited_friend_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["runner_session_id"], ["running_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "runner_session_id",
            "invited_friend_id",
            "status",
            name="uq_join_invite_session_friend_status",
        ),
    )


def downgrade() -> None:
    op.drop_table("join_run_invites")
