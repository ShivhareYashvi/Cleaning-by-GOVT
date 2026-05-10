"""Create initial EcoSync domain schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-08 10:30:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.Enum("citizen", "driver", "admin", name="userrole", native_enum=False), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("verified", sa.Boolean(), nullable=False),
        sa.Column("household_id", sa.String(length=64), nullable=True),
        sa.Column("electricity_bill_path", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_household_id"), "users", ["household_id"], unique=True)
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)

    op.create_table(
        "drivers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_number", sa.String(length=40), nullable=False),
        sa.Column(
            "availability",
            sa.Enum("available", "on_route", "off_duty", "suspended", name="driveravailability", native_enum=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
        sa.UniqueConstraint("vehicle_number"),
    )
    op.create_index(op.f("ix_drivers_id"), "drivers", ["id"], unique=False)

    op.create_table(
        "complaints",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "missed_pickup",
                "illegal_dumping",
                "damaged_bin",
                "driver_behavior",
                "other",
                name="complaintcategory",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image", sa.String(length=512), nullable=True),
        sa.Column(
            "status",
            sa.Enum("open", "in_review", "resolved", "rejected", name="complaintstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_complaints_id"), "complaints", ["id"], unique=False)
    op.create_index(op.f("ix_complaints_user_id"), "complaints", ["user_id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)

    op.create_table(
        "pickup_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=True),
        sa.Column("waste_type", sa.Enum("wet", "dry", "e-waste", "bulky", name="wastetype", native_enum=False), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "assigned", "in_progress", "completed", "cancelled", name="pickupstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column("scheduled_time", sa.Time(), nullable=False),
        sa.Column("coordinates", sa.JSON(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "waste_type", "scheduled_date", name="uq_pickup_user_waste_date"),
    )
    op.create_index(op.f("ix_pickup_requests_driver_id"), "pickup_requests", ["driver_id"], unique=False)
    op.create_index(op.f("ix_pickup_requests_id"), "pickup_requests", ["id"], unique=False)
    op.create_index(op.f("ix_pickup_requests_scheduled_date"), "pickup_requests", ["scheduled_date"], unique=False)
    op.create_index(op.f("ix_pickup_requests_user_id"), "pickup_requests", ["user_id"], unique=False)

    op.create_table(
        "rewards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column(
            "source",
            sa.Enum(
                "pickup_completion",
                "recycling_participation",
                "complaint_resolution",
                "admin_adjustment",
                name="rewardsource",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("redeemed", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rewards_id"), "rewards", ["id"], unique=False)
    op.create_index(op.f("ix_rewards_user_id"), "rewards", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_rewards_user_id"), table_name="rewards")
    op.drop_index(op.f("ix_rewards_id"), table_name="rewards")
    op.drop_table("rewards")
    op.drop_index(op.f("ix_pickup_requests_user_id"), table_name="pickup_requests")
    op.drop_index(op.f("ix_pickup_requests_scheduled_date"), table_name="pickup_requests")
    op.drop_index(op.f("ix_pickup_requests_id"), table_name="pickup_requests")
    op.drop_index(op.f("ix_pickup_requests_driver_id"), table_name="pickup_requests")
    op.drop_table("pickup_requests")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
    op.drop_index(op.f("ix_complaints_user_id"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_id"), table_name="complaints")
    op.drop_table("complaints")
    op.drop_index(op.f("ix_drivers_id"), table_name="drivers")
    op.drop_table("drivers")
    op.drop_index(op.f("ix_users_phone"), table_name="users")
    op.drop_index(op.f("ix_users_household_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
