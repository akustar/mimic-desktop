<template>
  <transition name="scale">
    <div class="modal">
      <transition-group name="opacity" tag="div">
        <div class="modal-container" v-for="(torrent, index) in parsed" :key="index">
          <div class="modal-inner">
            <div class="modal-header">
              <h3>{{ torrent.name }}</h3>
              <button type="button" @click="close(index)"><i class="material-icons md-20">close</i></button>
            </div>
            <div class="modal-body">
              <div>
                <dl>
                  <dt>다운로드</dt>
                  <dd>
                    <div class="settings-box">
                      <div>
                        <strong>위치</strong>
                        <span>{{ downloads }}</span>
                      </div>
                      <button type="button" class="button-filled-black" @click="setDownloads">위치 지정하기</button>
                    </div>
                    <div class="settings-box">
                      <div>
                        <strong>배포안함</strong>
                        <span>다운로드 완료 후 업로드를 진행하지 않습니다</span>
                      </div>
                      <div class="checkbox-slider">
                        <input type="checkbox" :id="'checkbox-slider-' + index" v-model="isPause">
                        <label :for="'checkbox-slider-' + index"></label>
                      </div>
                    </div>
                  </dd>
                </dl>
                <dl>
                  <dt>메타데이터</dt>
                  <dd>
                    <div class="settings-box">
                      <div>
                        <strong>설명</strong>
                        <span>{{ torrent.comment }}</span>
                      </div>
                    </div>
                    <div class="settings-box">
                      <div>
                        <strong>크기</strong>
                        <span>{{ prettyBytes(torrent.length) }}</span>
                      </div>
                    </div>
                    <div class="settings-box">
                      <div>
                        <strong>날짜</strong>
                        <span>{{ torrent.created }}</span>
                      </div>
                    </div>
                    <div class="settings-box file-list">
                      <div>
                        <strong>파일 목록</strong>
                        <div class="table">
                          <table>
                            <colgroup>
                              <col style="width: 24px;">
                              <col style="width: 70%">
                              <col>
                            </colgroup>
                            <thead>
                              <tr>
                                <th>
                                  <div class="checkbox">
                                    <input type="checkbox" id="all-check" @change="allSelection(torrent, $event.target.checked)" v-model="isAllSelected">
                                    <label for="all-check"><div class="checkmark"><svg name="Checkmark" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><polyline stroke="#6fcf97" stroke-width="2" points="3.5 9.5 7 13 15 5"></polyline></g></svg></div></label>
                                  </div>
                                </th>
                                <th class="text-left">이름</th>
                                <th class="text-right">크기</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(file, fileIndex) in torrent.files" :key="file.name">
                                <td>
                                  <div class="checkbox">
                                    <input type="checkbox" :id="'checkbox-'+index+'-'+fileIndex" @change="selection(torrent, file.length, fileIndex, $event.target.checked)" v-model="torrent.selections[fileIndex]">
                                    <label :for="'checkbox-'+index+'-'+fileIndex"><div class="checkmark"><svg name="Checkmark" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><polyline stroke="#6fcf97" stroke-width="2" points="3.5 9.5 7 13 15 5"></polyline></g></svg></div></label>
                                  </div>
                                </td>
                                <td class="ellipsis" :title="file.name">{{ file.name }}</td>
                                <td class="ellipsis text-right">{{ prettyBytes(file.length) }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>                                  
                  </dd>
                </dl>            
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="button-cancel" @click="close(index)">취소</button>
              <button type="button" class="button-filled-black" @click="confirm(torrent, index)">확인</button>
            </div>            
          </div>
        </div>
      </transition-group>
    </div>
  </transition>
</template>

<script>
  import { ipcRenderer, remote } from 'electron'
  import fs from 'fs'
  import prettyBytes from '@/lib/pretty-bytes'
  import uniqueKey from '@/lib/unique-key'

  export default {
    props: [
      'parsed',
      'infoHashList'
    ],
    data () {
      return {
        isAllSelected: true,
        isPause: false,
        downloads: ipcRenderer.sendSync('get', 'downloads')
      }
    },
    methods: {
      // 토렌트 다운로드를 시작합니다
      confirm (torrent, index) {
        const torrentKey = uniqueKey()
        const torrentId = torrent.torrentId
        const downloadPath = this.downloads
        const selections = torrent.selections
        const isPause = this.isPause
        
        torrent.status = '피어 연결 중'
        torrent.key = torrentKey
        
        // 토렌트 중복 체크
        if (this.infoHashList.includes(torrentId)) {
          ipcRenderer.send('wt-error', 'Cannot add duplicate torrent')
          // 모달을 닫습니다
          return this.close(index)
        }

        // 토렌트 다운로드 시작
        ipcRenderer.send('wt-start-torrent', torrentKey, torrentId, downloadPath, selections, isPause)

        // 토렌트가 연결되기 까지 시간이 걸리므로 연결되지않은 토렌트 정보를 먼저 보여줍니다
        this.tempTorrent(torrent)

        // 모달을 닫습니다
        this.close(index)
      },
      close (index) {
        this.parsed.splice(index, 1)

        if (this.parsed.length <= 0) this.$emit('close')
      },
      tempTorrent (torrent) {
        this.$emit('tempTorrent', torrent)
      },
      // 사용자가 원하는 파일만 선택해서 받을 수 있도록 합니다
      selection (torrent, fileSize, fileIndex, checked) {
        if (checked) {
          torrent.length += fileSize
        }
        else {
          torrent.length -= fileSize
        }

        this.isAllSelected = false
        torrent.selections[fileIndex] = checked
      },
      allSelection (torrent, checked) {
        let length = 0

        if (checked) {
          for (const file of torrent.files) {
            length += file.length
          }
        }

        torrent.length = length
        torrent.selections.fill(checked)
      },      
      // 다운로드 위치를 설정합니다
      setDownloads (fileName) {
        const win = remote.getCurrentWindow()
        const options = {
          title: `'${fileName}'를(을) 다운로드할 위치를 지정하세요`,
          defaultPath: this.downloads,
          properties: ['openFile', 'openDirectory']
        }
        remote.dialog.showOpenDialog(win, options, paths => {
          if (!Array.isArray(paths)) return

          this.downloads = paths[0]
          
          ipcRenderer.send('set', 'downloads', this.downloads)
        })
      },
      prettyBytes
    }
  }
</script>

<style>

</style>