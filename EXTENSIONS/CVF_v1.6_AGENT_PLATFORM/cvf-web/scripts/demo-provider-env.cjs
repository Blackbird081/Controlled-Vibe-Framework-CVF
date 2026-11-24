'use strict';

if (process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1') {
    const { serverKeys } = require('../src/data/windows-setup.json');
    // Next preserves defined environment entries when loading dotenv files.
    for (const { env } of serverKeys.providers) process.env[env] = '';
}
