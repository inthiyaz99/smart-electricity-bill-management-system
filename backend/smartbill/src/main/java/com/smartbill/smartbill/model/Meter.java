package com.smartbill.smartbill.model;

import jakarta.persistence.*;

@Entity
public class Meter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String meterNumber;

    private String consumerName;

    private String address;

    private double monthlyUsage;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Meter() {
    }

    public Meter(String meterNumber, String consumerName,
                  String address, double monthlyUsage) {

        this.meterNumber = meterNumber;
        this.consumerName = consumerName;
        this.address = address;
        this.monthlyUsage = monthlyUsage;
    }

    public Long getId() {
        return id;
    }

    public String getMeterNumber() {
        return meterNumber;
    }

    public void setMeterNumber(String meterNumber) {
        this.meterNumber = meterNumber;
    }

    public String getConsumerName() {
        return consumerName;
    }

    public void setConsumerName(String consumerName) {
        this.consumerName = consumerName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public double getMonthlyUsage() {
        return monthlyUsage;
    }

    public void setMonthlyUsage(double monthlyUsage) {
        this.monthlyUsage = monthlyUsage;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}