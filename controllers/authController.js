const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');



exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are now logged out! 👋');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    next();
  }
  req.flash('error', 'Oops you need to login');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  //1. check if user email exists
  const user = await User.findOne({email: req.body.email})
  if(!user) {
    req.flash('error', 'A password reset has been mailed to you.')
    return res.redirect('/login');
  }
  //2. set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000 //1 hour from now
  await user.save();
  //3. send email with token to reset password
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  req.flash('success', `Yopu have been emailed a pasword link ${resetURL}`);
  //4. redirect to login page
  res.redirect('/login');
}

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {$gt: Date.now()}
  });
  if(!user) {
    req.flash('error', 'Sorry, please reset your password');
    return res.redirect('/login');
  }
}