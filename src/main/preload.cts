import { contextBridge, ipcRenderer } from 'electron';
import type { TransactionsApi } from './transactions.js';

const api: TransactionsApi = {
  getCardCycle: () => ipcRenderer.invoke('card-cycle:get'),
  saveCardCycle: (settings) => ipcRenderer.invoke('card-cycle:save', settings),
  list: () => ipcRenderer.invoke('transactions:list'),
  save: (input, id) => ipcRenderer.invoke('transactions:save', input, id),
  remove: (id) => ipcRenderer.invoke('transactions:remove', id),
};

contextBridge.exposeInMainWorld('meshTransactions', api);
