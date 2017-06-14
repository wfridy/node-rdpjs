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


  /**
   * Receive capabilities from server
   * @param s {type.Stream}
   */
  recvClipboardCapsPDU(s) {
    // Start at 18
    // const pdu = data.pdu().read(s);
    console.log('recvClipboardCapsPDU', s);

    this.transport.once('cliprdr', (s) => {
      this.recvMonitorReadyPDU(s);
    });
  }


  /**
   * Receive monitor ready from server
   * @param s {type.Stream}
   */
  recvMonitorReadyPDU(s) {
    const pdu = data.pdu().read(s);
    console.log('recvMonitorReadyPDU', s);

    // this.transport.once('cliprdr', function(s) {
    //   self.recvMonitorReadyPDU(s);
    // });
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

