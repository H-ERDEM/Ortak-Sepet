package com.example.OrtakSepet1.dto;

import lombok.Data;

@Data
public class GrupSohbetMesajDto {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String senderName;
    private String text;
    private String time; // Format "HH:mm"
    private Boolean isSystem;
}
