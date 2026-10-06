/**
 * Artillery Custom Functions
 * Generates dynamic test data
 */

module.exports = {
  generateRandomCardId,
  generateRandomUserId,
  generateTimestamp,
};

function generateRandomCardId(context, events, done) {
  context.vars.cardId = `card_test_${Math.random().toString(36).substr(2, 9)}`;
  return done();
}

function generateRandomUserId(context, events, done) {
  context.vars.userId = `user_test_${Math.random().toString(36).substr(2, 9)}`;
  return done();
}

function generateTimestamp(context, events, done) {
  context.vars.timestamp = new Date().toISOString();
  return done();
}
