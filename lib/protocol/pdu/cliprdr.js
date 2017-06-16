const type = require('../../core').type;
const EventEmitter = require('events').EventEmitter;
const caps = require('./caps');
const log = require('../../core').log;
const data = require('./data');



/**
 * Cliprdr channel for all clipboard
 * capabilities exchange
 */
class Cliprdr extends EventEmitter {

  constructor(transport) {
    super();
    this.transport = transport;
    // must be init via connect event
    this.userId = 0;
    this.serverCapabilities = [];
    this.clientCapabilities = [];
  }

}


/**
 * Client side of Cliprdr channel automata
 * @param transport
 */
class Client extends Cliprdr {

  constructor(transport, fastPathTransport) {

    super(transport, fastPathTransport);

    const self = this;
    this.transport.once('connect', function(gccCore, userId, channelId) {
      self.connect(gccCore, userId, channelId);
    }).on('close', function() {
      self.emit('close');
    }).on('error', function (err) {
      self.emit('error', err);
    });
    
    // if (this.fastPathTransport) {
    //   this.fastPathTransport.on('fastPathData', function (secFlag, s) {
    //     self.recvFastPath(secFlag, s);
    //   });
    // }

  }

  /**
   * connect function
   * @param gccCore {type.Component(clientCoreData)}
   */
  connect(gccCore, userId, channelId) {
    this.gccCore = gccCore;
    this.userId = userId;
    this.channelId = channelId;
    this.transport.once('cliprdr', (s) => {
      this.recv(s);
    });
  }

  send(message) {
    this.transport.send('cliprdr', new type.Component([
      // Channel PDU Header
      new type.UInt32Le(message.size()),
      // CHANNEL_FLAG_FIRST | CHANNEL_FLAG_LAST | CHANNEL_FLAG_SHOW_PROTOCOL
      new type.UInt32Le(0x13),
      message
    ]));
  };

  recv(s) {
    s.offset = 18;
    const pdu = data.clipPDU().read(s), type = data.ClipPDUMsgType;
    console.log('msgType: ', pdu.obj.header.obj.msgType.value);
    switch (pdu.obj.header.obj.msgType.value) {
      case type.CB_MONITOR_READY:
        this.recvMonitorReadyPDU(s);
        break;
      case type.CB_FORMAT_LIST:
        this.recvFormatListPDU(s);
        break;
      case type.CB_FORMAT_LIST_RESPONSE:
        this.recvFormatListResponsePDU(s);
        break;
      case type.CB_FORMAT_DATA_REQUEST:
        this.recvFormatDataRequestPDU(s);
        break;
      case type.CB_FORMAT_DATA_RESPONSE:
        this.recvFormatDataResponsePDU(s);
        break;
      case type.CB_TEMP_DIRECTORY:
        break;
      case type.CB_CLIP_CAPS:
        this.recvClipboardCapsPDU(s);
        break;
      case type.CB_FILECONTENTS_REQUEST:
    }

    this.transport.once('cliprdr', (s) => {
      this.recv(s);
    });
  }

  /**
   * Receive capabilities from server
   * @param s {type.Stream}
   */
  recvClipboardCapsPDU(s) {
    // Start at 18
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    console.log('recvClipboardCapsPDU', s);
  }


  /**
   * Receive monitor ready from server
   * @param s {type.Stream}
   */
  recvMonitorReadyPDU(s) {
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    console.log('recvMonitorReadyPDU', s);

    this.sendClipboardCapsPDU();
    // this.sendClientTemporaryDirectoryPDU();
    this.sendFormatListPDU();
  }


  /**
   * send clipboard capabilities PDU
   */
  sendClipboardCapsPDU() {
    this.send(new type.Component({
      msgType: new type.UInt16Le(0x07),
      msgFlags: new type.UInt16Le(0x00),
      dataLen: new type.UInt32Le(0x10),
      cCapabilitiesSets: new type.UInt16Le(0x01),
      pad1: new type.UInt16Le(0x00),
      capabilitySetType: new type.UInt16Le(0x01),
      lengthCapability: new type.UInt16Le(0x0c),
      version: new type.UInt32Le(0x02),
      capabilityFlags: new type.UInt32Le(0x02)
    }));
  }


  /**
   * send client temporary directory PDU
   */
  sendClientTemporaryDirectoryPDU(path = '') {
    // TODO
    this.send(new type.Component({
      msgType: new type.UInt16Le(0x06),
      msgFlags: new type.UInt16Le(0x00),
      dataLen: new type.UInt32Le(0x0208),
      wszTempDir: new type.BinaryString(new Buffer('D:\\Vectors' + Array(251).join('\x00'), 'ucs2'), { readLength : new type.CallableValue(520)})
    }));
  }


  /**
   * send format list PDU
   */
  sendFormatListPDU() {
    this.send(new type.Component({
      msgType: new type.UInt16Le(0x02),
      msgFlags: new type.UInt16Le(0x00),

      dataLen: new type.UInt32Le(0x24),

      formatId6: new type.UInt32Le(0xc004),
      formatName6: new type.BinaryString(new Buffer('Native\x00' , 'ucs2'), { readLength : new type.CallableValue(14)}),

      formatId8: new type.UInt32Le(0x03),
      formatName8: new type.UInt16Le(0x00),

      formatId9: new type.UInt32Le(0x08),
      formatName9: new type.UInt16Le(0x00),

      formatId0: new type.UInt32Le(0x11),
      formatName0: new type.UInt16Le(0x00),
      
      // dataLen: new type.UInt32Le(0xe0),

      // formatId1: new type.UInt32Le(0xc08a),
      // formatName1: new type.BinaryString(new Buffer('Rich Text Format\x00' , 'ucs2'), { readLength : new type.CallableValue(34)}),

      // formatId2: new type.UInt32Le(0xc145),
      // formatName2: new type.BinaryString(new Buffer('Rich Text Format Without Objects\x00' , 'ucs2'), { readLength : new type.CallableValue(66)}),

      // formatId3: new type.UInt32Le(0xc143),
      // formatName3: new type.BinaryString(new Buffer('RTF As Text\x00' , 'ucs2'), { readLength : new type.CallableValue(24)}),

      // formatId4: new type.UInt32Le(0x01),
      // formatName4: new type.BinaryString(0x00),

      formatId5: new type.UInt32Le(0x0d),
      formatName5: new type.UInt16Le(0x00),

      // formatId6: new type.UInt32Le(0xc004),
      // formatName6: new type.BinaryString(new Buffer('Native\x00' , 'ucs2'), { readLength : new type.CallableValue(14)}),
      
      // formatId7: new type.UInt32Le(0xc00e),
      // formatName7: new type.BinaryString(new Buffer('Object Descriptor\x00' , 'ucs2'), { readLength : new type.CallableValue(36)}),

      // formatId8: new type.UInt32Le(0x03),
      // formatName8: new type.UInt16Le(0x00),

      // formatId9: new type.UInt32Le(0x10),
      // formatName9: new type.UInt16Le(0x00),

      // formatId0: new type.UInt32Le(0x07),
      // formatName0: new type.UInt16Le(0x00),
    }));

  }

  recvFormatListPDU(s) {
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    console.log('FormatListPDU', s);
    this.sendFormatListResponsePDU();
  }


  /**
   * Send format list reesponse
   */
   sendFormatListResponsePDU() {
     this.send(new type.Component({
        msgType: new type.UInt16Le(data.ClipPDUMsgType.CB_FORMAT_LIST_RESPONSE),
        msgFlags: new type.UInt16Le(0x01),
        dataLen: new type.UInt32Le(0x00),
     }));

     this.sendFormatDataRequestPDU();
   }

  /**
   * Receive format list response from server
   * @param s {type.Stream}
   */
  recvFormatListResponsePDU(s) {
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    console.log('recvFormatListResponsePDU', s);
    // this.sendFormatListResponsePDU();
  }


  sendFormatDataRequestPDU(formartId = 0x0d) {
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    cthis.send(new type.Component({
      msgType: new type.UInt16Le(data.ClipPDUMsgType.CB_FORMAT_DATA_REQUEST),
      msgFlags: new type.UInt16Le(0x00),
      dataLen: new type.UInt32Le(0x04),
      requestedFormatId: new type.UInt32Le(formartId),
    }));
  }

  recvFormatDataRequestPDU(s) {
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    console.log('recvFormatDataRequestPDU', s);
    this.sendFormatDataResponsePDU();
  }

  sendFormatDataResponsePDU() {
    this.send(new type.Component({
      msgType: new type.UInt16Le(data.ClipPDUMsgType.CB_FORMAT_DATA_RESPONSE),
      msgFlags: new type.UInt16Le(0x01),
      dataLen: new type.UInt32Le(0x18),
      requestedFormatData: new new type.BinaryString(new Buffer('Hello world\x00' , 'ucs2'), { readLength : new type.CallableValue(24)})
    }));
    this.transport.once('cliprdr', (s) => {
      this.recvFormatDataRequestPDU(s);
    });
  }

  recvFormatDataResponsePDU(s) {
    s.offset = 18;
    // const pdu = data.clipPDU().read(s);
    console.log('recvFormatDataResponsePDU', s);
  }

}
	



module.exports = {
  Client
}

