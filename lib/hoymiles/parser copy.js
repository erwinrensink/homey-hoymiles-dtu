module.exports = {

  power(result) {
    return result.data[0];
  },

  energy(result) {
    return (result.data[0] << 16) | result.data[1];
  },

  temperature(result) {
    return result.data[0];
  },  

};