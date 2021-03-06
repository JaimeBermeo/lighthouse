/**
Copyright (c) 2015 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../../base/base.js");

'use strict';

global.tr.exportTo('tr.ui.annotations', function() {
  /**
   * A base class for all annotation views.
   * @constructor
   */
  function AnnotationView(viewport, annotation) {
  }

  AnnotationView.prototype = {
    draw: function(ctx) {
      throw new Error('Not implemented');
    }
  };

  return {
    AnnotationView: AnnotationView
  };
});
