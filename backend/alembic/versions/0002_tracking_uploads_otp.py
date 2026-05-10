"""Add OTP persistence and live driver tracking tables.

Revision ID: 0002_tracking_uploads_otp
Revises: 0001_initial_schema
Create Date: 2026-05-08 17:55:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_tracking_uploads_otp"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "otp_challenges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("code_hash", sa.String(length=255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("delivery_channel", sa.String(length=30), nullable=False),
        sa.Column("delivery_reference", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_otp_challenges_id"), "otp_challenges", ["id"], unique=False)
    op.create_index(op.f("ix_otp_challenges_phone"), "otp_challenges", ["phone"], unique=False)

    op.create_table(
        "driver_locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("pickup_id", sa.Integer(), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "assigned", "in_progress", "completed", "cancelled", name="pickupstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pickup_id"], ["pickup_requests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_driver_locations_id"), "driver_locations", ["id"], unique=False)
    op.create_index(op.f("ix_driver_locations_driver_id"), "driver_locations", ["driver_id"], unique=False)
    op.create_index(op.f("ix_driver_locations_pickup_id"), "driver_locations", ["pickup_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_driver_locations_pickup_id"), table_name="driver_locations")
    op.drop_index(op.f("ix_driver_locations_driver_id"), table_name="driver_locations")
    op.drop_index(op.f("ix_driver_locations_id"), table_name="driver_locations")
    op.drop_table("driver_locations")
    op.drop_index(op.f("ix_otp_challenges_phone"), table_name="otp_challenges")
    op.drop_index(op.f("ix_otp_challenges_id"), table_name="otp_challenges")
    op.drop_table("otp_challenges")
