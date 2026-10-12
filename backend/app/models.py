from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base


class Building(Base):
    __tablename__ = "buildings"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    building_type = Column(String, nullable=False)
    occupancy = Column(Integer, default=100)
    area_sqm = Column(Float, default=1000.0)
    base_kwh_per_day = Column(Float, default=1000.0)
    base_water_l_per_day = Column(Float, default=10000.0)
    base_waste_kg_per_day = Column(Float, default=100.0)

    readings = relationship("Reading", back_populates="building", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyEvent", back_populates="building", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="building", cascade="all, delete-orphan")


class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building_id = Column(String, ForeignKey("buildings.id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    
    electricity_kwh = Column(Float, nullable=False, default=0.0)
    water_litres = Column(Float, nullable=False, default=0.0)
    waste_kg = Column(Float, nullable=False, default=0.0)
    waste_recycled_kg = Column(Float, nullable=False, default=0.0)
    
    cost_inr = Column(Float, nullable=False, default=0.0)
    co2e_kg = Column(Float, nullable=False, default=0.0)

    is_anomaly = Column(Boolean, default=False)
    anomaly_type = Column(String, nullable=True)

    building = relationship("Building", back_populates="readings")


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building_id = Column(String, ForeignKey("buildings.id"), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False, default=datetime.utcnow)
    resource = Column(String, nullable=False)  # electricity | water | waste
    severity = Column(String, nullable=False)  # low | medium | critical
    duration_hours = Column(Float, default=1.0)
    
    estimated_excess_units = Column(Float, default=0.0)
    estimated_excess_inr = Column(Float, default=0.0)
    estimated_excess_co2e = Column(Float, default=0.0)
    
    probable_cause = Column(String, nullable=False)
    status = Column(String, default="detected")  # detected | acknowledged | resolved
    resolved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    building = relationship("Building", back_populates="anomalies")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building_id = Column(String, ForeignKey("buildings.id"), index=True, nullable=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # electricity | water | waste | operations
    description = Column(Text, nullable=False)
    trigger_data = Column(Text, nullable=False)  # Explainability reasoning
    
    projected_savings_inr_month = Column(Float, nullable=False, default=0.0)
    projected_savings_co2e_month = Column(Float, nullable=False, default=0.0)
    investment_cost_inr = Column(Float, default=0.0)
    payback_months = Column(Float, default=0.0)
    
    status = Column(String, default="active")  # active | applied | dismissed
    applied_at = Column(DateTime, nullable=True)

    building = relationship("Building", back_populates="recommendations")


class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building_id = Column(String, nullable=True)  # None = campus wide
    resource = Column(String, nullable=False)  # electricity | water | waste
    target_reduction_pct = Column(Float, nullable=False, default=10.0)
    monthly_limit_units = Column(Float, nullable=False, default=0.0)
    month = Column(String, nullable=False)  # YYYY-MM
