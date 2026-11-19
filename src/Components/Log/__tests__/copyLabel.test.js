const enCommon = require('../../../translations/en/common.json');
const frCommon = require('../../../translations/fr/common.json');

describe('Copy log button', () => {
  it('should not say English in the English interface', () => {
    expect(enCommon.escButtonCopyLog).toEqual('Copy log');
  });

  it('should say the copied log is in English in French', () => {
    expect(frCommon.escButtonCopyLog).toEqual('Copier le journal (anglais)');
  });
});
