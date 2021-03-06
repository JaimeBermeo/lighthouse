/**
Copyright (c) 2015 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../model/user_model/load_expectation.js");

'use strict';

global.tr.exportTo('tr.importer', function() {
  // This global instant event marks the start of a navigation.
  var NAVIGATION_START = 'NavigationTiming navigationStart';

  // This render-process instant event marks the first contentful paint in a
  // main frame.
  var FIRST_CONTENTFUL_PAINT_TITLE = 'firstContentfulPaint';

  function getAllFrameEvents(modelHelper) {
    var frameEvents = [];
    frameEvents.push.apply(frameEvents,
        modelHelper.browserHelper.getFrameEventsInRange(
            tr.model.helpers.IMPL_FRAMETIME_TYPE, modelHelper.model.bounds));

    tr.b.iterItems(modelHelper.rendererHelpers, function(pid, renderer) {
      frameEvents.push.apply(frameEvents, renderer.getFrameEventsInRange(
          tr.model.helpers.IMPL_FRAMETIME_TYPE, modelHelper.model.bounds));
    });
    return frameEvents.sort(tr.importer.compareEvents);
  }

  // If a thread contains a typical initialization slice, then the first event
  // on that thread is a startup event.
  function getStartupEvents(modelHelper) {
    function isStartupSlice(slice) {
      return slice.title === 'BrowserMainLoop::CreateThreads';
    }
    var events = modelHelper.browserHelper.getAllAsyncSlicesMatching(
        isStartupSlice);
    var deduper = new tr.model.EventSet();
    events.forEach(function(event) {
      var sliceGroup = event.parentContainer.sliceGroup;
      var slice = sliceGroup && sliceGroup.findFirstSlice();
      if (slice)
        deduper.push(slice);
    });
    return deduper.toArray();
  }

  // Match every event in |openingEvents| to the first following event from
  // |closingEvents| and return an array containing a load interaction record
  // for each pair.
  function findLoadExpectationsInternal(
      modelHelper, subtypeName, openingEvents, closingEvents) {
    var loads = [];
    openingEvents.forEach(function(openingEvent) {
      closingEvents.forEach(function(closingEvent) {
        // Ignore opening event that already have a closing event.
        if (openingEvent.closingEvent)
          return;

        // Ignore closing events that already belong to an opening event.
        if (closingEvent.openingEvent)
          return;

        // Ignore closing events before |openingEvent|.
        if (closingEvent.start <= openingEvent.start)
          return;

        // Ignore events from different threads.
        if (openingEvent.parentContainer.parent.pid !==
              closingEvent.parentContainer.parent.pid)
          return;

        // This is the first closing event for this opening event, record it.
        openingEvent.closingEvent = closingEvent;
        closingEvent.openingEvent = openingEvent;
        var lir = new tr.model.um.LoadExpectation(
            modelHelper.model, subtypeName, openingEvent.start,
            closingEvent.end - openingEvent.start);
        lir.associatedEvents.push(openingEvent);
        lir.associatedEvents.push(closingEvent);
        loads.push(lir);
      });
    });
    return loads;
  }

  function findRenderLoadExpectations(modelHelper) {
    var events = [];
    modelHelper.model.iterateAllEvents(function(event) {
      if ((event.title === NAVIGATION_START) ||
          (event.title === FIRST_CONTENTFUL_PAINT_TITLE))
        events.push(event);
    });
    events.sort(tr.importer.compareEvents);

    var loads = [];
    var startEvent = undefined;
    events.forEach(function(event) {
      if (event.title === NAVIGATION_START) {
        startEvent = event;
      } else if (event.title === FIRST_CONTENTFUL_PAINT_TITLE) {
        if (startEvent) {
          loads.push(new tr.model.um.LoadExpectation(
              modelHelper.model, tr.model.um.LOAD_SUBTYPE_NAMES.SUCCESSFUL,
              startEvent.start, event.start - startEvent.start));
          startEvent = undefined;
        }
      }
    });

    // If the trace ended between navigation start and first contentful paint,
    // then make a LoadExpectation that ends at the end of the trace.
    if (startEvent) {
      loads.push(new tr.model.um.LoadExpectation(
            modelHelper.model, tr.model.um.LOAD_SUBTYPE_NAMES.SUCCESSFUL,
            startEvent.start, modelHelper.model.bounds.max - startEvent.start));
    }

    return loads;
  }

  // Match up RenderFrameImpl events with frame render events.
  function findLoadExpectations(modelHelper) {
    var loads = [];

    var commitLoadEvents =
        modelHelper.browserHelper.getCommitProvisionalLoadEventsInRange(
            modelHelper.model.bounds);

    // Attach frame events to every startup events.
    var startupEvents = getStartupEvents(modelHelper);
    var frameEvents = getAllFrameEvents(modelHelper);
    var startupLoads = findLoadExpectationsInternal(
        modelHelper, tr.model.um.LOAD_SUBTYPE_NAMES.STARTUP,
        startupEvents, frameEvents);
    loads.push.apply(loads, startupLoads);

    loads.push.apply(loads, findRenderLoadExpectations(modelHelper));

    return loads;
  }

  return {
    findLoadExpectations: findLoadExpectations
  };
});
