const { createHmac } = require('crypto');

function buildServiceTokenHeaders(token, payload) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', token)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return {
    body,
    headers: {
      'x-cvf-service-token': token,
      'x-cvf-service-timestamp': timestamp,
      'x-cvf-service-signature': signature,
    },
  };
}

module.exports = {
  buildServiceTokenHeaders,
};
