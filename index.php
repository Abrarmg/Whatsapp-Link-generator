<?php
/**
 * The main template file
 *
 * @package GitHub_Deployed_Theme
 */

get_header();
?>

<div id="primary" class="content-area" style="padding: 20px;">
    <main id="main" class="site-main">

        <?php if ( have_posts() ) : ?>
            <?php while ( have_posts() ) : the_post(); ?>
                <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                    <header class="entry-header">
                        <?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
                    </header>

                    <div class="entry-content">
                        <?php the_content(); ?>
                    </div>
                </article>
            <?php endwhile; ?>
        <?php else : ?>
            <p>No content found.</p>
        <?php endif; ?>

    </main>
</div>

<?php
get_footer();
