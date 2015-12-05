'use strict'

var gulp = require('gulp')
var standard = require('gulp-standard')
var mocha = require('gulp-mocha')
var istanbul = require('gulp-istanbul')
var coveralls = require('gulp-coveralls')

var output_path = '.'

gulp.task('isCircle', function() {
  if (process.env.CIRCLE) {
    output_path = process.env.CIRCLE_TEST_REPORTS
  }
});

gulp.task('standard', function () {
  return gulp.src(['./index.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

gulp.task('pre-test', function () {
  return gulp.src(['src/**/*.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire())
})

gulp.task('test', ['pre-test'], function (cb) {
  return gulp.src([
    './test/**/*.js'
  ])
  .pipe(mocha({
    reporter: 'mocha-junit-reporter',
    reporterOptions: {
        mochaFile: output_path + '/junit/results.xml'
    }
}))
  .pipe(istanbul.writeReports({
    dir: output_path + '/coverage'
  })) // stores reports in "coverage" directory
})

gulp.task('coveralls', function (cb) {
  return gulp.src('./coverage/lcov.info')
  .pipe(coveralls())
})

gulp.task('dev', ['isCircle', 'standard', 'test', 'coveralls'])

gulp.task('default', ['main'])
