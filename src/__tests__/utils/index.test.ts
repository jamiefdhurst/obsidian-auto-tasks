import { capitalise } from '../../utils';

describe('capitalise', () => {
  
  it('capitalises words correctly', () => {
    expect(capitalise('an example')).toEqual('An example');
    expect(capitalise('foo')).toEqual('Foo');
    expect(capitalise('Bar')).toEqual('Bar');
    expect(capitalise('BAZ')).toEqual('BAZ');
  });

});
