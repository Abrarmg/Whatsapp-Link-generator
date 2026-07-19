<?php
/**
 * WhatsApp Link Generator Theme functions and definitions
 *
 * @package WhatsApp_Link_Generator_Theme
 */

if ( ! function_exists( 'whatsapp_link_generator_setup' ) ) {
    function whatsapp_link_generator_setup() {
        // Add default posts and comments RSS feed links to head.
        add_theme_support( 'automatic-feed-links' );

        // Let WordPress manage the document title.
        add_theme_support( 'title-tag' );

        // Enable support for Post Thumbnails on posts and pages.
        add_theme_support( 'post-thumbnails' );

        // Switch default core markup for search form, comment form, etc. to output valid HTML5.
        add_theme_support( 'html5', array(
            'search-form',
            'comment-form',
            'comment-list',
            'gallery',
            'caption',
            'style',
            'script',
        ) );
    }
}
add_action( 'after_setup_theme', 'whatsapp_link_generator_setup' );

function whatsapp_link_generator_enqueue_assets() {
    $theme_dir = get_template_directory();
    $theme_uri = get_template_directory_uri();
    
    // Enqueue the base stylesheet
    wp_enqueue_style( 'whatsapp-link-generator-theme-style', get_stylesheet_uri(), array(), '1.0.0' );

    // Enqueue built React assets from the dist folder
    // Check manifest file first (if built with Vite manifest enabled)
    $manifest_path = $theme_dir . '/dist/.vite/manifest.json';
    if ( ! file_exists( $manifest_path ) ) {
        $manifest_path = $theme_dir . '/dist/manifest.json';
    }
    
    if ( file_exists( $manifest_path ) ) {
        $manifest = json_decode( file_get_contents( $manifest_path ), true );
        if ( $manifest ) {
            // Find index entry. Vite 5/6 manifest lists entrypoints or files.
            // Let's iterate and find the main JS and CSS files.
            $main_js = '';
            $css_files = array();
            
            // Check index.html entry
            if ( isset( $manifest['index.html'] ) ) {
                $main_js = $manifest['index.html']['file'];
                if ( isset( $manifest['index.html']['css'] ) ) {
                    $css_files = $manifest['index.html']['css'];
                }
            } else {
                // Search keys for anything ending in main.tsx or index.html or main.js
                foreach ( $manifest as $key => $value ) {
                    if ( isset( $value['isEntry'] ) && $value['isEntry'] ) {
                        if ( isset( $value['file'] ) ) {
                            $main_js = $value['file'];
                        }
                        if ( isset( $value['css'] ) ) {
                            $css_files = array_merge( $css_files, $value['css'] );
                        }
                        break;
                    }
                }
            }
            
            if ( $main_js ) {
                wp_enqueue_script(
                    'whatsapp-link-generator-react-js',
                    $theme_uri . '/dist/' . $main_js,
                    array(),
                    null,
                    true
                );
                
                foreach ( $css_files as $index => $css_file ) {
                    wp_enqueue_style(
                        'whatsapp-link-generator-react-css-' . $index,
                        $theme_uri . '/dist/' . $css_file,
                        array(),
                        null
                    );
                }
                return;
            }
        }
    }
    
    // Fallback: Scan the dist/assets directory
    $assets_dir = $theme_dir . '/dist/assets';
    if ( is_dir( $assets_dir ) ) {
        $files = scandir( $assets_dir );
        $js_file = null;
        $css_file = null;
        foreach ( $files as $file ) {
            if ( pathinfo( $file, PATHINFO_EXTENSION ) === 'js' && ( strpos( $file, 'index' ) === 0 || strpos( $file, 'main' ) === 0 ) ) {
                $js_file = $file;
            }
            if ( pathinfo( $file, PATHINFO_EXTENSION ) === 'css' && ( strpos( $file, 'index' ) === 0 || strpos( $file, 'main' ) === 0 ) ) {
                $css_file = $file;
            }
        }
        
        if ( $js_file ) {
            wp_enqueue_script(
                'whatsapp-link-generator-react-js',
                $theme_uri . '/dist/assets/' . $js_file,
                array(),
                null,
                true
            );
        }
        if ( $css_file ) {
            wp_enqueue_style(
                'whatsapp-link-generator-react-css',
                $theme_uri . '/dist/assets/' . $css_file,
                array(),
                null
            );
        }
    }
}
add_action( 'wp_enqueue_scripts', 'whatsapp_link_generator_enqueue_assets' );
