'use strict'

var gulp = require('gulp')
var standard = require('gulp-standard')
var mocha = require('gulp-mocha')
var istanbul = require('gulp-istanbul')
var coveralls = require('gulp-coveralls')

gulp.task('isCircle', function() {
  if (process.env.CIRCLECI === true) {
    process.env.OUTPUT_PATH = process.env.CIRCLE_TEST_REPORTS
  } else {
    process.env.OUTPUT_PATH = '.'
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
        mochaFile: process.env.OUTPUT_PATH + '/junit/results.xml'
    }
}))
  .pipe(istanbul.writeReports({
    dir: process.env.OUTPUT_PATH + '/coverage'
  })) // stores reports in "coverage" directory
})

gulp.task('coveralls', function (cb) {
  return gulp.src('./coverage/lcov.info')
  .pipe(coveralls())
})

gulp.task('dev', ['isCircle', 'standard', 'test', 'coveralls'])

gulp.task('default', ['main'])
