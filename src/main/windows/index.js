import { app } from 'electron'
import Store from '../Store'
import client from './client'
import webTorrent from './webTorrent'
import streaming from './streaming'
import ipc from '../ipc'
import tray from '../tray'
import menu from '../menu'


const defaults = {
  downloads: app.getPath('downloads'),
  windowBounds: {
    width: 400,
    height: 640
  },
  torrents: {}
}
const store = new Store(defaults)

app.on('ready', () => {
  client.create(store)
  webTorrent.create()
  
  menu.init()
  tray.create()

  ipc.init(store, client, webTorrent, streaming)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  client.win.show()
})

