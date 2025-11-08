<?php

/**
 * @file
 * Admin page callbacks for Asyntai module.
 */

/**
 * Form builder for Asyntai settings.
 */
function asyntai_settings_form($form, &$form_state) {
  $config = config('asyntai.settings');
  $site_id = trim((string) $config->get('site_id'));
  $account_email = trim((string) $config->get('account_email'));
  $script_url = trim((string) $config->get('script_url'));

  if ($script_url === '') {
    $script_url = 'https://asyntai.com/static/js/chat-widget.js';
  }

  // Add CSS and JS
  backdrop_add_css(backdrop_get_path('module', 'asyntai') . '/css/admin.css');
  backdrop_add_js(backdrop_get_path('module', 'asyntai') . '/js/admin.js');

  $form['wrapper'] = array(
    '#type' => 'container',
    '#attributes' => array('id' => 'asyntai-settings-wrap'),
  );

  $form['wrapper']['heading'] = array(
    '#markup' => '<h1>Asyntai AI Chatbot</h1>',
  );

  // Status display
  $status_color = $site_id ? '#28a745' : '#dc3545';
  $status_text = $site_id ? 'Connected' : 'Not connected';

  $form['wrapper']['status'] = array(
    '#type' => 'container',
    '#attributes' => array('id' => 'asyntai-status'),
  );

  $status_markup = 'Status: <span style="color:' . $status_color . ';font-weight:600;">' . $status_text . '</span>';

  if ($site_id && $account_email) {
    $status_markup .= ' as ' . check_plain($account_email);
  }

  $form['wrapper']['status']['text'] = array(
    '#markup' => $status_markup . ' ',
  );

  if ($site_id) {
    $form['wrapper']['status']['reset_button'] = array(
      '#markup' => '<button type="button" id="asyntai-reset" class="button" style="margin-left: 8px;">Reset</button>',
    );
  }

  // Alert box
  $form['wrapper']['alert'] = array(
    '#type' => 'container',
    '#attributes' => array(
      'id' => 'asyntai-alert',
      'style' => 'display:none;',
    ),
  );

  // Connected state - only show if connected
  if ($site_id) {
    $form['wrapper']['connected_box'] = array(
      '#type' => 'container',
      '#attributes' => array('id' => 'asyntai-connected-box'),
    );
    $form['wrapper']['connected_box']['inner'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'style' => 'padding:32px;border:1px solid #ddd;border-radius:8px;background:#fff;text-align:center;',
      ),
    );
    $form['wrapper']['connected_box']['inner']['content'] = array(
      '#markup' => '<h2>Asyntai is now enabled</h2>' .
        '<p class="asyntai-connected-text">Set up your AI chatbot, review chat logs and more:</p>' .
        '<a class="button button-primary" href="https://asyntai.com/dashboard" target="_blank" rel="noopener">Open Asyntai Panel</a>' .
        '<p style="margin:20px 0 0;color:#666;"><strong>Tip:</strong> If you want to change how the AI answers, please <a href="https://asyntai.com/dashboard#setup" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">go here</a>.</p>',
    );
  }
  else {
    // Create empty container with display none for JS
    $form['wrapper']['connected_box'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'id' => 'asyntai-connected-box',
        'style' => 'display:none;',
      ),
    );
  }

  // Not connected state - only show if not connected
  if (!$site_id) {
    $form['wrapper']['popup_wrap'] = array(
      '#type' => 'container',
      '#attributes' => array('id' => 'asyntai-popup-wrap'),
    );
    $form['wrapper']['popup_wrap']['inner'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'style' => 'padding:32px;border:1px solid #ddd;border-radius:8px;background:#fff;text-align:center;',
      ),
    );
    $form['wrapper']['popup_wrap']['inner']['text'] = array(
      '#markup' => '<p class="asyntai-intro-text">Create a free Asyntai account or sign in to enable the chatbot</p>',
    );
    $form['wrapper']['popup_wrap']['inner']['button'] = array(
      '#markup' => '<button type="button" id="asyntai-connect-btn" class="button button-primary">Get started</button>',
    );
    $form['wrapper']['popup_wrap']['inner']['help'] = array(
      '#markup' => '<p style="margin:16px 0 0;color:#666;">If it doesn\'t work, <a href="#" id="asyntai-fallback-link" target="_blank" rel="noopener" style="color:#2563eb;text-decoration:underline;">open the connect window</a>.</p>',
    );
  }
  else {
    // Create empty container with display none for JS
    $form['wrapper']['popup_wrap'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'id' => 'asyntai-popup-wrap',
        'style' => 'display:none;',
      ),
    );
  }

  // Hidden fields to store data (not displayed to user)
  $form['site_id'] = array(
    '#type' => 'hidden',
    '#value' => $site_id,
  );

  $form['script_url'] = array(
    '#type' => 'hidden',
    '#value' => $script_url,
  );

  $form['account_email'] = array(
    '#type' => 'hidden',
    '#value' => $account_email,
  );

  // Don't show the default submit button
  $form['actions']['#access'] = FALSE;

  return $form;
}

/**
 * Form submission handler for asyntai_settings_form().
 */
function asyntai_settings_form_submit($form, &$form_state) {
  // This form doesn't use traditional submission
  // Settings are saved via AJAX
}
