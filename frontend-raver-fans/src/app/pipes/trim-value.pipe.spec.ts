import { TrimValuePipe } from './trim-value.pipe';

describe('TrimValuePipe', () => {
  it('create an instance', () => {
    const pipe = new TrimValuePipe();
    expect(pipe).toBeTruthy();
  });
});
