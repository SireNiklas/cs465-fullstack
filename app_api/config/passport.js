const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ email: username });
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        if (!user.validPassword(password)) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        // login is the only moment the plaintext exists, so it is the only
        // chance to move an old low-iteration hash up to the current count
        if (user.needsRehash()) {
          user.setPassword(password);
          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);
