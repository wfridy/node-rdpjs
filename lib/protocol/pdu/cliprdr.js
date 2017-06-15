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

  constructor(transport, fastPathTransport) {
    super();
    this.transport = transport;
    this.fastPathTransport = fastPathTransport;
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
      this.recvClipboardCapsPDU(s);
    });
  }

  sendPDU(message) {
    this.transport.send('cliprdr', message);
  };

  /**
   * Receive capabilities from server
   * @param s {type.Stream}
   */
  recvClipboardCapsPDU(s) {
    // Start at 18
    s.offset = 18;
    const pdu = data.clipPDU().read(s);
    console.log('recvClipboardCapsPDU', pdu);

    this.transport.once('cliprdr', (s) => {
      this.recvMonitorReadyPDU(s);
    });
  }


  /**
   * Receive monitor ready from server
   * @param s {type.Stream}
   */
  recvMonitorReadyPDU(s) {
    s.offset = 18;
    const pdu = data.clipPDU().read(s);
    console.log('recvMonitorReadyPDU', pdu);

    this.sendClipboardCapsPDU();
  }


  sendClipboardCapsPDU() {
    this.sendPDU(new type.Component({
      msgType: new type.UInt16Le(0x07),
      msgFlags: new type.UInt16Le(0x00),
      dataLen: new type.UInt32Le(0x10),
      cCapabilitiesSets: new type.UInt16Le(0x01),
      pad1: new type.UInt16Le(0x00),
      capabilitySetType: new type.UInt16Le(0x01),
      lengthCapability: new type.UInt16Le(0x0c),
      version: new type.UInt32Le(0x02),
      capabilityFlags: new type.UInt32Le(0x0e)
    }));

    this.sendPDU(new type.Component({
      msgType: new type.UInt16Le(0x06),
      msgFlags: new type.UInt16Le(0x00),
      dataLen: new type.UInt32Le(0x0208),
      wszTempDir: new type.BinaryString(new Buffer('C:\\lab.tmp' + Array(251).join('\x00'), 'ucs2'), { readLength : new type.CallableValue(520)})
    }));

    this.sendPDU(new type.Component({
      msgType: new type.UInt16Le(0x02),
      msgFlags: new type.UInt16Le(0x00),
      dataLen: new type.UInt32Le(0x24),
      formatId1: new type.UInt32Le(0xc004),
      formatName1: new type.BinaryString(new Buffer('Native' , 'ucs2'), { readLength : new type.CallableValue(14)}),
      formatId2: new type.UInt32Le(0x03),
      formatName2: new type.UInt16Le(0x00),
      formatId3: new type.UInt32Le(0x08),
      formatName3: new type.UInt16Le(0x00),
      formatId4: new type.UInt32Le(0x11),
      formatName4: new type.UInt16Le(0x00),
    }));

    this.transport.once('cliprdr', (s) => {
      const pdu = data.clipPDU().read(s);
      console.log('FormatListPDU', pdu);
    });
  }

  
  // recvFastPath (secFlag, s) {
  //   while (s.availableLength() > 0) {
  //     const pdu = data.fastPathUpdatePDU().read(s);
  //     console.log(pdu.obj.updateHeader.value & 0xf);
  //   }
  // };
}
	



module.exports = {
  Client
}

