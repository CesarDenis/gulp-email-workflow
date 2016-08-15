const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync');
const del = require('del');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('styles', () => {
  return gulp.src(['src/styles/**/*.scss', 'src/styles/**/*.sass'])
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.', 'src/assets/scss']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

gulp.task('views', () => {
  return gulp.src('src/*.njk')
    .pipe($.nunjucksRender({path: 'src'}))
    .pipe(gulp.dest('.tmp'))
});

gulp.task('html', ['views', 'styles'], () => {
  return gulp.src(['src/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
    .pipe($.if('*.css', $.cssnano({safe: true, autoprefixer: false})))
    .pipe(gulp.dest('dist'));
});

gulp.task('inline', ['html'], () => {
  return gulp.src('dist/*.html')
    .pipe($.inline({
      base: 'dist/',
      disabledTypes: ['svg', 'img', 'js'],
      ignore: ['styles/inline.css']
    }))
    .pipe($.inlineCss({applyStyleTags: false, removeStyleTags: false}))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('src/img/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    })))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('extras', () => {
  return gulp.src([
    'src/*.*',
    '!src/*.html',
    '!src/*.njk'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['views', 'styles'], () => {
  browserSync({
    notify: false,
    port: 3000,
    server: {
      baseDir: ['.tmp', 'src'],
      index: "main.html"
    }
  });

  gulp.watch([
    'src/*.html',
    '.tmp/*.html',
    'src/img/**/*',
  ]).on('change', reload);

  gulp.watch([
    'src/styles/**/*.scss',
    'src/styles/**/*.sass',
    'src/assets/scss/**/*.scss',
    'src/assets/scss/**/*.sass'
  ], ['styles']);

  gulp.watch('src/**/*.html', ['views']);
  gulp.watch('src/**/*.njk', ['views']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 3000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('remove', del.bind(null, ['./build.zip']));

gulp.task('zip', ['remove', 'build'], () => {
  return gulp.src('dist/**')
    .pipe($.zip('build.zip'))
    .pipe(gulp.dest('./'));
});

gulp.task('build', ['inline', 'images', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
