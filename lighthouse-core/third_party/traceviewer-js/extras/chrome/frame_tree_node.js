/**
Copyright (c) 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../../model/object_instance.js");

'use strict';

global.tr.exportTo('tr.e.chrome', function() {
  var constants = tr.e.cc.constants;

  var ObjectSnapshot = tr.model.ObjectSnapshot;
  var ObjectInstance = tr.model.ObjectInstance;

  function FrameTreeNodeSnapshot() {
    ObjectSnapshot.apply(this, arguments);
  }

  FrameTreeNodeSnapshot.prototype = {
    __proto__: ObjectSnapshot.prototype,

    preInitialize: function() {
    },

    initialize: function() {
    },

    get userFriendlyName() {
      return 'FrameTreeNode';
    }
  };

  ObjectSnapshot.register(
      FrameTreeNodeSnapshot,
      {typeName: 'FrameTreeNode'});

  function FrameTreeNodeInstance() {
    ObjectInstance.apply(this, arguments);
  }

  FrameTreeNodeInstance.prototype = {
    __proto__: ObjectInstance.prototype
  };

  ObjectInstance.register(
      FrameTreeNodeInstance,
      {typeName: 'FrameTreeNode'});

  return {
    FrameTreeNodeSnapshot: FrameTreeNodeSnapshot,
    FrameTreeNodeInstance: FrameTreeNodeInstance
  };
});
