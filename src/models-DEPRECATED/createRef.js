module.exports = function createRef(type, id) {
  return {
    refID: id,
    refType: type,
    type: 'REF',
  };
};
