package com.example.OrtakSepet1.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.OrtakSepet1.dto.GrupDto;
import com.example.OrtakSepet1.dto.GrupSohbetMesajDto;
import com.example.OrtakSepet1.dto.GrupUrunDto;
import com.example.OrtakSepet1.dto.KullaniciDto;
import com.example.OrtakSepet1.entity.Grup;
import com.example.OrtakSepet1.entity.GrupSohbetMesaji;
import com.example.OrtakSepet1.entity.GrupUrun;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.enums.GrupDurumu;
import com.example.OrtakSepet1.repository.GrupRepository;
import com.example.OrtakSepet1.repository.GrupSohbetMesajRepository;
import com.example.OrtakSepet1.repository.GrupUrunRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;

@Service
@Transactional
public class GrupServisi {

    @Autowired
    private GrupRepository groupRepository;

    @Autowired
    private KullaniciRepository userRepository;

    @Autowired
    private GrupUrunRepository groupProductRepository;

    @Autowired
    private GrupSohbetMesajRepository groupChatMessageRepository;

    @Autowired
    private com.example.OrtakSepet1.repository.UrunRepository productRepository;

    // Create group
    public GrupDto createGroup(GrupDto dto, Long liderId) {
        Kullanici lider = userRepository.findById(liderId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        Grup group = new Grup();
        group.setGrup_adi(dto.getGrup_adi());
        group.setAciklama(dto.getAciklama());
        group.setLokasyon_etiketi(dto.getLokasyon_etiketi());
        group.setLokasyon_adresi(dto.getLokasyon_adresi());
        group.setLokasyon_lat(dto.getLokasyon_lat());
        group.setLokasyon_lng(dto.getLokasyon_lng());
        group.setMin_rating_sarti(dto.getMin_rating_sarti() != null ? dto.getMin_rating_sarti() : 4.0);
        group.setTotalPrice(BigDecimal.ZERO);
        group.setInviteCode(UUID.randomUUID());
        group.setStatus(GrupDurumu.AKTIF);
        group.setOlusturma_tarihi(LocalDateTime.now());
        group.setLider(lider);
        group.getMembers().add(lider);
        group.setIban("TR00 0000 0000 0000 0000 0000 00");

        Grup saved = groupRepository.save(group);

        // If frontend provided a prefill product, add it atomically to the newly created group
        if (dto.getPrefillProduct() != null) {
            try {
                GrupUrun product = new GrupUrun();
                product.setUrunAdi(dto.getPrefillProduct().getUrunAdi());
                product.setGuncelFiyat(dto.getPrefillProduct().getGuncelFiyat());
                product.setUrunUrl(dto.getPrefillProduct().getUrunUrl());
                product.setResimUrl(dto.getPrefillProduct().getResimUrl());
                product.setPlatformAdi(dto.getPrefillProduct().getPlatformAdi());
                product.setEkleyenKullaniciId(liderId);
                Integer prefMiktar = dto.getPrefillProduct().getMiktar();
                product.setMiktar(prefMiktar != null ? prefMiktar : 1);
                product.setGroup(saved);

                groupProductRepository.save(product);
                saved.getProducts().add(product);

                // fiyatı yeniden hesapla
                recalculateTotalPrice(saved);
                saved = groupRepository.save(saved);
            } catch (Exception e) {
                System.err.println("[GROUPS] Error adding prefill product: " + e.getMessage());
            }
        }

        return mapToDto(saved);
    }

    // davetiye kodu
    public GrupDto joinGroupWithCode(String inviteCode, Long userId) {
        UUID uuid;
        try {
            uuid = UUID.fromString(inviteCode);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Geçersiz davet kodu.");
        }

        Grup group = groupRepository.findAll().stream()
                .filter(g -> g.getInviteCode() != null && g.getInviteCode().equals(uuid))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Bu davet koduna ait grup bulunamadı."));

        if (group.getStatus() != GrupDurumu.AKTIF) {
            throw new RuntimeException("Bu grup şu anda aktif değil, katılım sağlanamaz.");
        }

        Kullanici user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        if (user.getRating_puani() != null && user.getRating_puani() < group.getMin_rating_sarti()) {
            throw new RuntimeException("Güven puanınız (" + user.getRating_puani()
                    + ") bu gruba katılmak için yetersiz. Gereken: " + group.getMin_rating_sarti());
        }

        group.getMembers().add(user);
        Grup saved = groupRepository.save(group);
        return mapToDto(saved);
    }

    // ürünü gruba ekleme 
    public GrupDto addProductToGroup(Long groupId, GrupUrunDto dto, Long userId) {
        Grup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));

        if (group.getStatus() == GrupDurumu.ODEME_BEKLENIYOR) {
            throw new RuntimeException("Grup ödeme aşamasında olduğu için yeni ürün eklenemez.");
        }

        // url kontrolü 
        String url = dto.getUrunUrl() != null ? dto.getUrunUrl().trim() : "";
        if (url.isEmpty()) {
            throw new IllegalArgumentException("Ürün bağlantısı boş olamaz.");
        }
        if (!url.toLowerCase().startsWith("http://") && !url.toLowerCase().startsWith("https://")) {
            throw new IllegalArgumentException("Geçerli bir ürün bağlantısı girin (http veya https içermelidir).");
        }

        GrupUrun product = new GrupUrun();
        product.setUrunAdi(dto.getUrunAdi());
        product.setGuncelFiyat(dto.getGuncelFiyat());
        product.setUrunUrl(dto.getUrunUrl());
        product.setResimUrl(dto.getResimUrl());
        product.setPlatformAdi(dto.getPlatformAdi());
        product.setEkleyenKullaniciId(userId);
    Integer dtoMiktar = dto.getMiktar();
    product.setMiktar(dtoMiktar != null ? dtoMiktar : 1);
        product.setGroup(group);

        groupProductRepository.save(product);
        group.getProducts().add(product);

        // Save or update in general products catalog table
        if (productRepository != null && dto.getUrunUrl() != null && !dto.getUrunUrl().isBlank()) {
            try {
                java.util.Optional<com.example.OrtakSepet1.entity.Urun> existing = productRepository
                        .findByUrunUrl(dto.getUrunUrl());
                com.example.OrtakSepet1.entity.Urun p;
                if (existing.isPresent()) {
                    p = existing.get();
                    p.setGuncel_fiyat(dto.getGuncelFiyat() != null ? dto.getGuncelFiyat().doubleValue() : 0.0);
                    p.setUrun_adi(dto.getUrunAdi());
                    p.setResim_url(dto.getResimUrl());
                } else {
                    p = new com.example.OrtakSepet1.entity.Urun();
                    p.setUrun_adi(dto.getUrunAdi());
                    p.setPlatform_adi(dto.getPlatformAdi());
                    p.setGuncel_fiyat(dto.getGuncelFiyat() != null ? dto.getGuncelFiyat().doubleValue() : 0.0);
                    p.setUrun_url(dto.getUrunUrl());
                    p.setResim_url(dto.getResimUrl());
                }
                productRepository.save(p);
            } catch (Exception e) {
                System.err.println("[GROUPS] Error saving product to products catalog: " + e.getMessage());
            }
        }

        // hesaplama 
        recalculateTotalPrice(group);

        Grup saved = groupRepository.save(group);
        return mapToDto(saved);
    }

    // durum değiştirme 
    public GrupDto changeGroupStatus(Long groupId, Long liderId, String newStatusStr) {
        Grup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));

        if (!group.getLider().getId().equals(liderId)) {
            throw new RuntimeException("Bu işlemi sadece grup lideri gerçekleştirebilir.");
        }

        try {
            GrupDurumu newStatus = GrupDurumu.valueOf(newStatusStr.toUpperCase());
            group.setStatus(newStatus);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Geçersiz grup statüsü: " + newStatusStr);
        }

        Grup saved = groupRepository.save(group);
        return mapToDto(saved);
    }

    // kullanıcı ceza 
    public void penalizeUser(Long groupId, Long liderId, Long targetUserId) {
        Grup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));

        if (!group.getLider().getId().equals(liderId)) {
            throw new RuntimeException("Sadece grup lideri ceza puanı verebilir.");
        }

        Kullanici targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Kullanıcı bulunamadı."));

        double currentRating = targetUser.getRating_puani() != null ? targetUser.getRating_puani() : 5.0;
        targetUser.setRating_puani(Math.max(1.0, currentRating - 0.5));
        userRepository.save(targetUser);
    }

    // grup detayı alma
    public GrupDto getGroupById(Long id) {
        Grup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));
        return mapToDto(group);
    }

    // konuma göre arama 
    public List<GrupDto> searchGroupsByLokasyon(String lokasyon) {
        return groupRepository.findAll().stream()
                .filter(g -> g.getLokasyon_etiketi() != null
                        && g.getLokasyon_etiketi().toLowerCase().contains(lokasyon.toLowerCase()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // List all groups
    public List<GrupDto> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public void deleteGroup(Long id) {
        if (!groupRepository.existsById(id)) {
            throw new RuntimeException("Grup bulunamadı.");
        }
        // önce sohbet mesajlarını sil
        List<GrupSohbetMesaji> messages = groupChatMessageRepository.findByGroupIdOrderByTimeAsc(id);
        groupChatMessageRepository.deleteAll(messages);

        // sonra grubu sil 
        groupRepository.deleteById(id);
    }

    private void recalculateTotalPrice(Grup group) {
        BigDecimal total = BigDecimal.ZERO;
        for (GrupUrun p : group.getProducts()) {
            BigDecimal price = p.getGuncelFiyat() != null ? p.getGuncelFiyat() : BigDecimal.ZERO;
            int miktar = p.getMiktar() != null ? p.getMiktar() : 1;
            total = total.add(price.multiply(BigDecimal.valueOf(miktar)));
        }
        group.setTotalPrice(total);
    }

    private GrupDto mapToDto(Grup g) {
        GrupDto dto = new GrupDto();
        dto.setId(g.getId());
        dto.setLider_id(g.getLider().getId());
        dto.setGrup_adi(g.getGrup_adi());
        dto.setLokasyon_etiketi(g.getLokasyon_etiketi());
        dto.setLokasyon_adresi(g.getLokasyon_adresi());
        dto.setLokasyon_lat(g.getLokasyon_lat());
        dto.setLokasyon_lng(g.getLokasyon_lng());
        dto.setMin_rating_sarti(g.getMin_rating_sarti());
        dto.setAciklama(g.getAciklama());
        dto.setOlusturma_tarihi(g.getOlusturma_tarihi());
        dto.setIban(g.getIban());
        dto.setTotalPrice(g.getTotalPrice());
        dto.setInviteCode(g.getInviteCode() != null ? g.getInviteCode().toString() : null);
        dto.setStatus(g.getStatus() != null ? g.getStatus().name() : null);

        dto.setMembers(g.getMembers().stream().map(m -> {
            KullaniciDto u = new KullaniciDto();
            u.setId(m.getId());
            u.setAd_soyad(m.getAd_soyad());
            u.setEmail(m.getEmail());
            u.setTelefon(m.getTelefon());
            u.setRol(m.getRol());
            u.setRating_puani(m.getRating_puani());
            return u;
        }).collect(Collectors.toList()));

        dto.setProducts(g.getProducts().stream().map(p -> {
            GrupUrunDto pd = new GrupUrunDto();
            pd.setId(p.getId());
            pd.setUrunAdi(p.getUrunAdi());
            pd.setGuncelFiyat(p.getGuncelFiyat());
            pd.setUrunUrl(p.getUrunUrl());
            pd.setResimUrl(p.getResimUrl());
            pd.setPlatformAdi(p.getPlatformAdi());
            pd.setEkleyenKullaniciId(p.getEkleyenKullaniciId());
            pd.setMiktar(p.getMiktar());
            return pd;
        }).collect(Collectors.toList()));

        return dto;
    }

    // Update group IBAN
    public GrupDto updateGroupIban(Long groupId, Long liderId, String newIban) {
        Grup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));

        if (!group.getLider().getId().equals(liderId)) {
            throw new RuntimeException("Bu işlemi sadece grup lideri gerçekleştirebilir.");
        }

        group.setIban(newIban);
        Grup saved = groupRepository.save(group);
        return mapToDto(saved);
    }

    // Save chat message
    public GrupSohbetMesajDto saveChatMessage(Long groupId, GrupSohbetMesajDto messageDto) {
        Grup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));

        GrupSohbetMesaji message = new GrupSohbetMesaji();
        message.setGroup(group);
        message.setSenderId(messageDto.getSenderId());
        message.setSenderName(messageDto.getSenderName());
        message.setText(messageDto.getText());
        message.setTime(LocalDateTime.now());
        message.setIsSystem(messageDto.getIsSystem() != null ? messageDto.getIsSystem() : false);

        GrupSohbetMesaji saved = groupChatMessageRepository.save(message);
        return mapToChatMessageDto(saved);
    }

    // Get chat messages for group
    public List<GrupSohbetMesajDto> getChatMessages(Long groupId) {
        return groupChatMessageRepository.findByGroupIdOrderByTimeAsc(groupId).stream()
                .map(this::mapToChatMessageDto)
                .collect(Collectors.toList());
    }

    private GrupSohbetMesajDto mapToChatMessageDto(GrupSohbetMesaji m) {
        GrupSohbetMesajDto dto = new GrupSohbetMesajDto();
        dto.setId(m.getId());
        dto.setGroupId(m.getGroup().getId());
        dto.setSenderId(m.getSenderId());
        dto.setSenderName(m.getSenderName());
        dto.setText(m.getText());
        dto.setIsSystem(m.getIsSystem());
        if (m.getTime() != null) {
            dto.setTime(m.getTime().format(DateTimeFormatter.ofPattern("HH:mm")));
        } else {
            dto.setTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        }
        return dto;
    }

    // Remove product from group shopping cart
    public GrupDto removeProductFromGroup(Long groupId, Long productId, Long userId) {
        Grup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Grup bulunamadı."));

        if (group.getStatus() == GrupDurumu.ODEME_BEKLENIYOR || group.getStatus() == GrupDurumu.SIPARIS_VERILDI
                || group.getStatus() == GrupDurumu.TAMAMLANDI) {
            throw new RuntimeException("Grup kilitli olduğu için ürün silinemez.");
        }

        GrupUrun product = groupProductRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Ürün bulunamadı."));

        if (!product.getEkleyenKullaniciId().equals(userId) && !group.getLider().getId().equals(userId)) {
            throw new RuntimeException("Bu ürünü silme yetkiniz yok.");
        }

        group.getProducts().remove(product);
        groupProductRepository.delete(product);

        recalculateTotalPrice(group);
        Grup saved = groupRepository.save(group);
        return mapToDto(saved);
    }
}
