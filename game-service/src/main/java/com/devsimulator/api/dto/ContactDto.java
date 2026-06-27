package com.devsimulator.api.dto;

import com.devsimulator.model.Contact;

public record ContactDto(String id, String name, String role, String avatar, String status, int unread) {
    public static ContactDto from(Contact c, int unread) {
        return new ContactDto(c.id(), c.name(), c.role(), c.avatar(), c.status(), unread);
    }
}
