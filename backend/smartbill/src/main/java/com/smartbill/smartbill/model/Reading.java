package com.smartbill.smartbill.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Reading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double previousReading;
    private double currentReading;
    private double unitsUsed;
    private String readingDate;

    @jakarta.persistence.ManyToOne
    @jakarta.persistence.JoinColumn(name = "meter_id")
    private Meter meter;

    public Reading() {
    }

    public Reading(double previousReading, double currentReading, double unitsUsed, String readingDate) {
        this.previousReading = previousReading;
        this.currentReading = currentReading;
        this.unitsUsed = unitsUsed;
        this.readingDate = readingDate;
    }

    public Long getId() {
        return id;
    }

    public double getPreviousReading() {
        return previousReading;
    }

    public void setPreviousReading(double previousReading) {
        this.previousReading = previousReading;
    }

    public double getCurrentReading() {
        return currentReading;
    }

    public void setCurrentReading(double currentReading) {
        this.currentReading = currentReading;
    }

    public double getUnitsUsed() {
        return unitsUsed;
    }

    public void setUnitsUsed(double unitsUsed) {
        this.unitsUsed = unitsUsed;
    }

    public String getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(String readingDate) {
        this.readingDate = readingDate;
    }

    public Meter getMeter() {
        return meter;
    }

    public void setMeter(Meter meter) {
        this.meter = meter;
    }
}