'use strict';

var 	gulp           = require('gulp'),
		gutil          = require('gulp-util' ),
		sass           = require('gulp-sass'),
		globbing       = require('gulp-css-globbing'),
		browserSync    = require('browser-sync'),
		concat         = require('gulp-concat'),
		uglify         = require('gulp-uglify'),
		cleanCSS       = require('gulp-clean-css'),
		del            = require('del'),
		imagemin       = require('gulp-imagemin'),
		pngquant       = require('imagemin-pngquant'),
		cache          = require('gulp-cache'),
		autoprefixer   = require('gulp-autoprefixer'),
		rename         = require('gulp-rename'),
		browserify     = require('browserify'),
		sourceStream   = require('vinyl-source-stream');
		
// =================== FLOW ===================

gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: 'app/public'
		}
	})
});

gulp.task('sass', function() {
	return gulp.src('app/public/sass/styles.scss')
		.pipe(globbing({extensions: ['.scss']}))
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleanCSS({keepBreaks: true}))
		.pipe(rename('styles.min.css'))
		.pipe(gulp.dest('app/public/css'))
		.pipe(browserSync.reload({stream: true}))
});

gulp.task('browserify', function() {
    return browserify('app/public/js/entry.js')
        .bundle()
        .pipe(sourceStream('bundle.js'))
        .pipe(gulp.dest('app/public/js/'))
        .pipe(browserSync.reload({stream: true}))
});

gulp.task('libs', function() {
	return gulp.src([
		// 'app/public/libs/jquery/dist/jquery.min.js',
		])
		.pipe(concat('libs.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('app/public/js'));
});

gulp.task('watch', ['sass', 'libs', 'browserify', 'browser-sync'], function() {
	gulp.watch('app/public/sass/**/*.scss', ['sass']);
	gulp.watch('app/public/*.html', browserSync.reload);
	gulp.watch('app/public/js/**/*.js', ['browserify']);
});

gulp.task('default', ['watch']);

// =================== BUILD ===================

gulp.task('imagemin', function() {
	return gulp.src('app/public/img/**/*')
		.pipe(cache(imagemin({
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('dist/img')); 
});

gulp.task('removedist', function() { return del.sync('dist'); });

gulp.task('build', ['removedist', 'imagemin','sass', 'libs'], function() {

	var buildCss = gulp.src('app/public/css/styles.min.css')
	.pipe(cleanCSS())
	.pipe(gulp.dest('dist/css'));

	var buildFiles = gulp.src([
		'app/public/**.html',
		'app/public/.htaccess'
	]).pipe(gulp.dest('dist'));

	var buildFonts = gulp.src('app/public/fonts/**/*').pipe(gulp.dest('dist/fonts'));

	var buildJs = gulp.src('app/public/js/bundle.js')
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
});

// =================== OTHER ===================

gulp.task('clearcache', function () { return cache.clearAll(); });