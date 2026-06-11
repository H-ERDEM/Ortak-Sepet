package com.example.OrtakSepet1;

import com.example.OrtakSepet1.dto.GrupDto;
import com.example.OrtakSepet1.dto.GrupSohbetMesajDto;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import com.example.OrtakSepet1.service.GrupServisi;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class GroupServiceTests {

    @Autowired
    private GrupServisi groupService;

    @Autowired
    private KullaniciRepository userRepository;

    @Test
    public void testCreateGroupAndIbanUpdate() {
        // Create user
        Kullanici user = new Kullanici();
        user.setAd_soyad("Test Kullanici");
        user.setEmail("testuser@ortaksepet.com");
        user.setSifre("password");
        user = userRepository.save(user);

        // Create group
        GrupDto groupDto = new GrupDto();
        groupDto.setGrup_adi("Test İmece Grubu");
        groupDto.setLokasyon_etiketi("Test Lokasyon");
        groupDto.setMin_rating_sarti(3.0);
        
        GrupDto createdGroup = groupService.createGroup(groupDto, user.getId());
        assertNotNull(createdGroup.getId());
        assertEquals("TR00 0000 0000 0000 0000 0000 00", createdGroup.getIban());

        // Update IBAN
        String newIban = "TR12 3456 7890 1234 5678 9012 34";
        GrupDto updatedGroup = groupService.updateGroupIban(createdGroup.getId(), user.getId(), newIban);
        assertEquals(newIban, updatedGroup.getIban());
    }

    @Test
    public void testGroupChatPersistence() {
        // Create user
        Kullanici user = new Kullanici();
        user.setAd_soyad("Chat Kullanici");
        user.setEmail("chatuser@ortaksepet.com");
        user.setSifre("password");
        user = userRepository.save(user);

        // Create group
        GrupDto groupDto = new GrupDto();
        groupDto.setGrup_adi("Chat Grup");
        groupDto.setLokasyon_etiketi("Test");
        GrupDto createdGroup = groupService.createGroup(groupDto, user.getId());

        // Send messages
        GrupSohbetMesajDto msg1 = new GrupSohbetMesajDto();
        msg1.setSenderId(user.getId());
        msg1.setSenderName(user.getAd_soyad());
        msg1.setText("Merhaba!");
        msg1.setIsSystem(false);

        GrupSohbetMesajDto savedMsg1 = groupService.saveChatMessage(createdGroup.getId(), msg1);
        assertNotNull(savedMsg1.getId());
        assertEquals("Merhaba!", savedMsg1.getText());

        GrupSohbetMesajDto msg2 = new GrupSohbetMesajDto();
        msg2.setSenderId(0L);
        msg2.setSenderName("Sistem");
        msg2.setText("Kullanıcı katıldı.");
        msg2.setIsSystem(true);
        groupService.saveChatMessage(createdGroup.getId(), msg2);

        // Fetch messages
        List<GrupSohbetMesajDto> chatList = groupService.getChatMessages(createdGroup.getId());
        assertEquals(2, chatList.size());
        assertEquals("Merhaba!", chatList.get(0).getText());
        assertTrue(chatList.get(1).getIsSystem());
    }
}
