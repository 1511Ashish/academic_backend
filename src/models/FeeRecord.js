const message = 'FeeRecord model is deprecated in v2';

export default function deprecatedFeeRecord() {
  throw new Error(message);
}
