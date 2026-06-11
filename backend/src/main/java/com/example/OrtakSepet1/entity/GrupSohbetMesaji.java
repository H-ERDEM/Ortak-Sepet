/**
 * GrupSohbetMesaji: İmece grupları içinde üyeler veya sistem tarafından gönderilen
 * sohbet mesajı kayıtlarını temsil eden JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_chat_messages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GrupSohbetMesaji {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Grup group;

    private Long senderId;
    private String senderName;

    @Column(length = 2048)
    private String text;

    private LocalDateTime time;
    private Boolean isSystem;
}
