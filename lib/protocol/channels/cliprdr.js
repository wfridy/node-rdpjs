var type = require('../../core').type;

/**
 * https://msdn.microsoft.com/en-us/library/cc240513.aspx
 */
const CliprdrChannelDef = new type.Component({
  name : new type.BinaryString(new Buffer('cliprdr' + '\x00', 'binary'), { readLength : new type.CallableValue(8) }),
  // CHANNEL_OPTION_INITIALIZED |
  // CHANNEL_OPTION_ENCRYPT_RDP |
  // CHANNEL_OPTION_COMPRESS_RDP |
  // CHANNEL_OPTION_SHOW_PROTOCOL
  options : new type.UInt32Le(0xc0a00000)
});

module.exports = {
  CliprdrChannelDef,
}
