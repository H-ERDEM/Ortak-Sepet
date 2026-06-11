/**
 * @file grupServisi.js
 * @description İmece grupları ile ilgili backend REST isteklerini (grup kurma, davet kodu ile katılma,
 * ürünü sepetten silme, grubu tamamen silme, ödemeleri doğrulama, sohbet mesajlarını çekme ve gönderme) sarmalayan API servisidir.
 */
import apiClient from './apiIstemcisi';

const API_URL = '/api/groups';

export const createGroup = async (groupData, liderId) => {
  const response = await apiClient.post(`${API_URL}/create?liderId=${liderId}`, groupData);
  return response.data;
};

export const joinGroup = async (inviteCode, kullaniciId) => {
  const response = await apiClient.post(`${API_URL}/join/${inviteCode}?kullaniciId=${kullaniciId}`);
  return response.data;
};

export const addProductToGroup = async (groupId, productData, kullaniciId) => {
  const response = await apiClient.post(`${API_URL}/${groupId}/add-product?kullaniciId=${kullaniciId}`, productData);
  return response.data;
};

export const updateGroupStatus = async (groupId, liderId, status) => {
  const response = await apiClient.post(`${API_URL}/${groupId}/status?liderId=${liderId}&status=${status}`);
  return response.data;
};

export const penalizeUser = async (groupId, liderId, targetUserId) => {
  const response = await apiClient.post(`${API_URL}/${groupId}/penalize?liderId=${liderId}&targetUserId=${targetUserId}`);
  return response.data;
};

export const getGroup = async (groupId) => {
  const response = await apiClient.get(`${API_URL}/${groupId}`);
  return response.data;
};

export const searchGroups = async (lokasyon) => {
  const response = await apiClient.get(`${API_URL}/search?lokasyon=${encodeURIComponent(lokasyon)}`);
  return response.data;
};

export const getAllGroups = async () => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const updateGroupIban = async (groupId, liderId, iban) => {
  const response = await apiClient.post(`${API_URL}/${groupId}/iban?liderId=${liderId}&iban=${encodeURIComponent(iban)}`);
  return response.data;
};

export const getGroupChat = async (groupId) => {
  const response = await apiClient.get(`${API_URL}/${groupId}/chat`);
  return response.data;
};

export const sendGroupChatMessage = async (groupId, messageData) => {
  const response = await apiClient.post(`${API_URL}/${groupId}/chat`, messageData);
  return response.data;
};

export const removeProductFromGroup = async (groupId, productId, kullaniciId) => {
  const response = await apiClient.delete(`${API_URL}/${groupId}/products/${productId}?kullaniciId=${kullaniciId}`);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await apiClient.delete(`${API_URL}/${groupId}`);
  return response.data;
};
