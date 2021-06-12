/*
 Copyright (c) 2012, Smartrak, David Leaver
 Leaflet.markercluster is an open-source JavaScript library for Marker Clustering on leaflet powered maps.
 https://github.com/danzel/Leaflet.markercluster
*/
(function (e, t) {
    L.MarkerClusterGroup = L.FeatureGroup.extend({
            options: {
                maxClusterRadius: 80,
                iconCreateFunction: null,
                spiderfyOnMaxZoom: !0,
                showCoverageOnHover: !0,
                zoomToBoundsOnClick: !0,
                singleMarkerMode: !1,
                disableClusteringAtZoom: null,
                animateAddingMarkers: !1,
                polygonOptions: {}
            },
            initialize: function (e) {
                L.Util.setOptions(this, e), this.options.iconCreateFunction || (this.options.iconCreateFunction = this._defaultIconCreateFunction), L.FeatureGroup.prototype.initialize.call(this, []), this._inZoomAnimation = 0, this._needsClustering = [], this._currentShownBounds = null
            },
            addLayer: function (e) {
                if (e instanceof L.LayerGroup) {
                    var t = [];
                    for (var n in e._layers) e._layers.hasOwnProperty(n) && t.push(e._layers[n]);
                    return this.addLayers(t)
                }
                this.options.singleMarkerMode && (e.options.icon = this.options.iconCreateFunction({
                    getChildCount: function () {
                        return 1
                    },
                    getAllChildMarkers: function () {
                        return [e]
                    }
                }));
                if (!this._map) return this._needsClustering.push(e), this;
                if (this.hasLayer(e)) return this;
                this._unspiderfy && this._unspiderfy(), this._addLayer(e, this._maxZoom);
                var r = e,
                    i = this._map.getZoom();
                if (e.__parent)
                    while (r.__parent._zoom >= i) r = r.__parent;
                return this._currentShownBounds.contains(r.getLatLng()) && (this.options.animateAddingMarkers ? this._animationAddLayer(e, r) : this._animationAddLayerNonAnimated(e, r)), this
            },
            removeLayer: function (e) {
                return this._map ? e.__parent ? (this._unspiderfy && (this._unspiderfy(), this._unspiderfyLayer(e)), this._removeLayer(e, !0), e._icon && (L.FeatureGroup.prototype.removeLayer.call(this, e), e.setOpacity(1)), this) : this : (this._arraySplice(this._needsClustering, e), this)
            },
            addLayers: function (e) {
                if (!this._map) return this._needsClustering = this._needsClustering.concat(e), this;
                for (var t = 0, n = e.length; t < n; t++) {
                    var r = e[t];
                    this._addLayer(r, this._maxZoom);
                    if (r.__parent && r.__parent.getChildCount() === 2) {
                        var i = r.__parent.getAllChildMarkers(),
                            s = i[0] === r ? i[1] : i[0];
                        L.FeatureGroup.prototype.removeLayer.call(this, s)
                    }
                }
                return this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds), this
            },
            removeLayers: function (e) {
                var t, n, r;
                if (!this._map) {
                    for (t = 0, n = e.length; t < n; t++) this._arraySplice(this._needsClustering, e[t]);
                    return this
                }
                for (t = 0, n = e.length; t < n; t++) r = e[t], this._removeLayer(r, !0, !0), r._icon && (L.FeatureGroup.prototype.removeLayer.call(this, r), r.setOpacity(1));
                this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds);
                for (t in this._layers) this._layers.hasOwnProperty(t) && (r = this._layers[t], r instanceof L.MarkerCluster && r._updateIcon());
                return this
            },
            clearLayers: function () {
                if (!this._map) return this._needsClustering = [], this;
                this._unspiderfy && this._unspiderfy();
                for (var e in this._layers) this._layers.hasOwnProperty(e) && L.FeatureGroup.prototype.removeLayer.call(this, this._layers[e]);
                return this._generateInitialClusters(), this
            },
            hasLayer: function (e) {
                if (this._needsClustering.length > 0) {
                    var t = this._needsClustering;
                    for (var n = t.length - 1; n >= 0; n--)
                        if (t[n] === e) return !0
                }
                return !!e.__parent && e.__parent._group === this
            },
            zoomToShowLayer: function (e, t) {
                var n = function () {
                    if ((e._icon || e.__parent._icon) && !this._inZoomAnimation) {
                        this._map.off("moveend", n, this), this.off("animationend", n, this);
                        if (e._icon) t();
                        else if (e.__parent._icon) {
                            var r = function () {
                                this.off("spiderfied", r, this), t()
                            };
                            this.on("spiderfied", r, this), e.__parent.spiderfy()
                        }
                    }
                };
                e._icon ? t() : e.__parent._zoom < this._map.getZoom() ? (this._map.on("moveend", n, this), e._icon || this._map.panTo(e.getLatLng())) : (this._map.on("moveend", n, this), this.on("animationend", n, this), this._map.setView(e.getLatLng(), e.__parent._zoom + 1), e.__parent.zoomToBounds())
            },
            onAdd: function (e) {
                L.FeatureGroup.prototype.onAdd.call(this, e), this._gridClusters || this._generateInitialClusters();
                for (var t = 0, n = this._needsClustering.length; t < n; t++) this._addLayer(this._needsClustering[t], this._maxZoom);
                this._needsClustering = [], this._map.on("zoomend", this._zoomEnd, this), this._map.on("moveend", this._moveEnd, this), this._spiderfierOnAdd && this._spiderfierOnAdd(), this._bindEvents(), this._zoom = this._map.getZoom(), this._currentShownBounds = this._getExpandedVisibleBounds(), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds)
            },
            onRemove: function (e) {
                this._map.off("zoomend", this._zoomEnd, this), this._map.off("moveend", this._moveEnd, this), this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", ""), this._spiderfierOnRemove && this._spiderfierOnRemove(), L.FeatureGroup.prototype.onRemove.call(this, e)
            },
            _arraySplice: function (e, t) {
                for (var n = e.length - 1; n >= 0; n--)
                    if (e[n] === t) {
                        e.splice(n, 1);
                        return
                    }
            },
            _removeLayer: function (e, t, n) {
                var r = this._gridClusters,
                    i = this._gridUnclustered,
                    s = this._map;
                if (t)
                    for (var o = this._maxZoom; o >= 0; o--)
                        if (!i[o].removeObject(e, s.project(e.getLatLng(), o))) break;
                var u = e.__parent,
                    a = u._markers,
                    f;
                this._arraySplice(a, e);
                while (u) {
                    u._childCount--;
                    if (u._zoom < 0) break;
                    t && u._childCount <= 1 ? (f = u._markers[0] === e ? u._markers[1] : u._markers[0], r[u._zoom].removeObject(u, s.project(u._cLatLng, u._zoom)), i[u._zoom].addObject(f, s.project(f.getLatLng(), u._zoom)), this._arraySplice(u.__parent._childClusters, u), u.__parent._markers.push(f), f.__parent = u.__parent, u._icon && (L.FeatureGroup.prototype.removeLayer.call(this, u), n || L.FeatureGroup.prototype.addLayer.call(this, f))) : (u._recalculateBounds(), (!n || !u._icon) && u._updateIcon()), u = u.__parent
                }
            },
            _propagateEvent: function (e) {
                e.target instanceof L.MarkerCluster && (e.type = "cluster" + e.type), L.FeatureGroup.prototype._propagateEvent.call(this, e)
            },
            _defaultIconCreateFunction: function (e) {
                var t = e.getChildCount(),
                    n = " marker-cluster-";
                return t < 10 ? n += "small" : t < 100 ? n += "medium" : n += "large", new L.DivIcon({
                    html: "<div><span>" + t + "</span></div>",
                    className: "marker-cluster" + n,
                    iconSize: new L.Point(40, 40)
                })
            },
            _bindEvents: function () {
                var e = null,
                    t = this._map,
                    n = this.options.spiderfyOnMaxZoom,
                    r = this.options.showCoverageOnHover,
                    i = this.options.zoomToBoundsOnClick;
                (n || i) && this.on("clusterclick", function (e) {
                    t.getMaxZoom() === t.getZoom() ? n && e.layer.spiderfy() : i && e.layer.zoomToBounds()
                }, this), r && (this.on("clustermouseover", function (n) {
                    if (this._inZoomAnimation) return;
                    e && t.removeLayer(e), n.layer.getChildCount() > 2 && (e = new L.Polygon(n.layer.getConvexHull(), this.options.polygonOptions), t.addLayer(e))
                }, this), this.on("clustermouseout", function () {
                    e && (t.removeLayer(e), e = null)
                }, this), t.on("zoomend", function () {
                    e && (t.removeLayer(e), e = null)
                }, this), t.on("layerremove", function (n) {
                    e && n.layer === this && (t.removeLayer(e), e = null)
                }, this))
            },
            _zoomEnd: function () {
                if (!this._map) return;
                this._mergeSplitClusters(), this._zoom = this._map._zoom, this._currentShownBounds = this._getExpandedVisibleBounds()
            },
            _moveEnd: function () {
                if (this._inZoomAnimation) return;
                var e = this._getExpandedVisibleBounds();
                this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, this._zoom, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, e), this._currentShownBounds = e;
                return
            },
            _generateInitialClusters: function () {
                var e = this._map.getMaxZoom(),
                    t = this.options.maxClusterRadius;
                this.options.disableClusteringAtZoom && (e = this.options.disableClusteringAtZoom - 1), this._maxZoom = e, this._gridClusters = {}, this._gridUnclustered = {};
                for (var n = e; n >= 0; n--) this._gridClusters[n] = new L.DistanceGrid(t), this._gridUnclustered[n] = new L.DistanceGrid(t);
                this._topClusterLevel = new L.MarkerCluster(this, -1)
            },
            _addLayer: function (e, t) {
                var n = this._gridClusters,
                    r = this._gridUnclustered,
                    i, s;
                for (; t >= 0; t--) {
                    i = this._map.project(e.getLatLng(), t);
                    var o = n[t].getNearObject(i);
                    if (o) {
                        o._addChild(e), e.__parent = o;
                        return
                    }
                    o = r[t].getNearObject(i);
                    if (o) {
                        o.__parent && this._removeLayer(o, !1);
                        var u = o.__parent,
                            a = new L.MarkerCluster(this, t, o, e);
                        n[t].addObject(a, this._map.project(a._cLatLng, t)), o.__parent = a, e.__parent = a;
                        var f = a;
                        for (s = t - 1; s > u._zoom; s--) f = new L.MarkerCluster(this, s, f), n[s].addObject(f, this._map.project(o.getLatLng(), s));
                        u._addChild(f);
                        for (s = t; s >= 0; s--)
                            if (!r[s].removeObject(o, this._map.project(o.getLatLng(), s))) break;
                        return
                    }
                    r[t].addObject(e, i)
                }
                this._topClusterLevel._addChild(e), e.__parent = this._topClusterLevel;
                return
            },
            _mergeSplitClusters: function () {
                this._zoom < this._map._zoom ? (this._animationStart(), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, this._zoom, this._getExpandedVisibleBounds()), this._animationZoomIn(this._zoom, this._map._zoom)) : this._zoom > this._map._zoom ? (this._animationStart(), this._animationZoomOut(this._zoom, this._map._zoom)) : this._moveEnd()
            },
            _getExpandedVisibleBounds: function () {
                var e = this._map,
                    t = e.getPixelBounds(),
                    n = L.Browser.mobile ? 0 : Math.abs(t.max.x - t.min.x),
                    r = L.Browser.mobile ? 0 : Math.abs(t.max.y - t.min.y),
                    i = e.unproject(new L.Point(t.min.x - n, t.min.y - r)),
                    s = e.unproject(new L.Point(t.max.x + n, t.max.y + r));
                return new L.LatLngBounds(i, s)
            },
            _animationAddLayerNonAnimated: function (e, t) {
                if (t === e) L.FeatureGroup.prototype.addLayer.call(this, e);
                else if (t._childCount === 2) {
                    t._addToMap();
                    var n = t.getAllChildMarkers();
                    L.FeatureGroup.prototype.removeLayer.call(this, n[0]), L.FeatureGroup.prototype.removeLayer.call(this, n[1])
                } else t._updateIcon()
            }
        }), L.MarkerClusterGroup.include(L.DomUtil.TRANSITION ? {
            _animationStart: function () {
                this._map._mapPane.className += " leaflet-cluster-anim", this._inZoomAnimation++
            },
            _animationEnd: function () {
                this._map && (this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", "")), this._inZoomAnimation--, this.fire("animationend")
            },
            _animationZoomIn: function (e, t) {
                var n = this,
                    r = this._getExpandedVisibleBounds(),
                    i;
                this._topClusterLevel._recursively(r, e, 0, function (s) {
                    var o = s._latlng,
                        u = s._markers,
                        a;
                    s._isSingleParent() && e + 1 === t ? (L.FeatureGroup.prototype.removeLayer.call(n, s), s._recursivelyAddChildrenToMap(null, t, r)) : (s.setOpacity(0), s._recursivelyAddChildrenToMap(o, t, r));
                    for (i = u.length - 1; i >= 0; i--) a = u[i], r.contains(a._latlng) || L.FeatureGroup.prototype.removeLayer.call(n, a)
                }), this._forceLayout();
                var s, o;
                n._topClusterLevel._recursivelyBecomeVisible(r, t);
                for (s in n._layers) n._layers.hasOwnProperty(s) && (o = n._layers[s], !(o instanceof L.MarkerCluster) && o._icon && o.setOpacity(1));
                n._topClusterLevel._recursively(r, e, t, function (e) {
                    e._recursivelyRestoreChildPositions(t)
                }), setTimeout(function () {
                    n._topClusterLevel._recursively(r, e, 0, function (e) {
                        L.FeatureGroup.prototype.removeLayer.call(n, e), e.setOpacity(1)
                    }), n._animationEnd()
                }, 250)
            },
            _animationZoomOut: function (e, t) {
                this._animationZoomOutSingle(this._topClusterLevel, e - 1, t), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, e, this._getExpandedVisibleBounds())
            },
            _animationZoomOutSingle: function (e, t, n) {
                var r = this._getExpandedVisibleBounds();
                e._recursivelyAnimateChildrenInAndAddSelfToMap(r, t + 1, n);
                var i = this;
                this._forceLayout(), e._recursivelyBecomeVisible(r, n), setTimeout(function () {
                    if (e._childCount === 1) {
                        var s = e._markers[0];
                        s.setLatLng(s.getLatLng()), s.setOpacity(1);
                        return
                    }
                    e._recursively(r, n, 0, function (e) {
                        e._recursivelyRemoveChildrenFromMap(r, t + 1)
                    }), i._animationEnd()
                }, 250)
            },
            _animationAddLayer: function (e, t) {
                var n = this;
                L.FeatureGroup.prototype.addLayer.call(this, e), t !== e && (t._childCount > 2 ? (t._updateIcon(), this._forceLayout(), this._animationStart(), e._setPos(this._map.latLngToLayerPoint(t.getLatLng())), e.setOpacity(0), setTimeout(function () {
                    L.FeatureGroup.prototype.removeLayer.call(n, e), e.setOpacity(1), n._animationEnd()
                }, 250)) : (this._forceLayout(), n._animationStart(), n._animationZoomOutSingle(t, this._map.getMaxZoom(), this._map.getZoom())))
            },
            _forceLayout: function () {
                L.Util.falseFn(document.body.offsetWidth)
            }
        } : {
            _animationStart: function () {},
            _animationZoomIn: function (e, t) {
                this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds())
            },
            _animationZoomOut: function (e, t) {
                this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds())
            },
            _animationAddLayer: function (e, t) {
                this._animationAddLayerNonAnimated(e, t)
            }
        }), L.MarkerCluster = L.Marker.extend({
            initialize: function (e, t, n, r) {
                L.Marker.prototype.initialize.call(this, n ? n._cLatLng || n.getLatLng() : new L.LatLng(0, 0), {
                    icon: this
                }), this._group = e, this._zoom = t, this._markers = [], this._childClusters = [], this._childCount = 0, this._iconNeedsUpdate = !0, this._bounds = new L.LatLngBounds, n && this._addChild(n), r && this._addChild(r)
            },
            getAllChildMarkers: function (e) {
                e = e || [];
                for (var t = this._childClusters.length - 1; t >= 0; t--) this._childClusters[t].getAllChildMarkers(e);
                for (var n = this._markers.length - 1; n >= 0; n--) e.push(this._markers[n]);
                return e
            },
            getChildCount: function () {
                return this._childCount
            },
            zoomToBounds: function () {
                this._group._map.fitBounds(this._bounds)
            },
            _updateIcon: function () {
                this._iconNeedsUpdate = !0, this._icon && this.setIcon(this)
            },
            createIcon: function () {
                return this._iconNeedsUpdate && (this._iconObj = this._group.options.iconCreateFunction(this), this._iconNeedsUpdate = !1), this._iconObj.createIcon()
            },
            createShadow: function () {
                return this._iconObj.createShadow()
            },
            _addChild: function (e, t) {
                this._iconNeedsUpdate = !0, this._expandBounds(e), e instanceof L.MarkerCluster ? (t || (this._childClusters.push(e), e.__parent = this), this._childCount += e._childCount) : (t || this._markers.push(e), this._childCount++), this.__parent && this.__parent._addChild(e, !0)
            },
            _expandBounds: function (e) {
                var t, n = e._wLatLng || e._latlng;
                e instanceof L.MarkerCluster ? (this._bounds.extend(e._bounds), t = e._childCount) : (this._bounds.extend(n), t = 1), this._cLatLng || (this._cLatLng = e._cLatLng || n);
                var r = this._childCount + t;
                this._wLatLng ? (this._wLatLng.lat = (n.lat * t + this._wLatLng.lat * this._childCount) / r, this._wLatLng.lng = (n.lng * t + this._wLatLng.lng * this._childCount) / r) : this._latlng = this._wLatLng = new L.LatLng(n.lat, n.lng)
            },
            _addToMap: function (e) {
                e && (this._backupLatlng = this._latlng, this.setLatLng(e)), L.FeatureGroup.prototype.addLayer.call(this._group, this)
            },
            _recursivelyAnimateChildrenIn: function (e, t, n) {
                this._recursively(e, 0, n - 1, function (e) {
                    var n = e._markers,
                        r, i;
                    for (r = n.length - 1; r >= 0; r--) i = n[r], i._icon && (i._setPos(t), i.setOpacity(0))
                }, function (e) {
                    var n = e._childClusters,
                        r, i;
                    for (r = n.length - 1; r >= 0; r--) i = n[r], i._icon && (i._setPos(t), i.setOpacity(0))
                })
            },
            _recursivelyAnimateChildrenInAndAddSelfToMap: function (e, t, n) {
                this._recursively(e, n, 0, function (r) {
                    r._recursivelyAnimateChildrenIn(e, r._group._map.latLngToLayerPoint(r.getLatLng()).round(), t), r._isSingleParent() && t - 1 === n ? (r.setOpacity(1), r._recursivelyRemoveChildrenFromMap(e, t)) : r.setOpacity(0), r._addToMap()
                })
            },
            _recursivelyBecomeVisible: function (e, t) {
                this._recursively(e, 0, t, null, function (e) {
                    e.setOpacity(1)
                })
            },
            _recursivelyAddChildrenToMap: function (e, t, n) {
                this._recursively(n, -1, t, function (r) {
                    if (t === r._zoom) return;
                    for (var i = r._markers.length - 1; i >= 0; i--) {
                        var s = r._markers[i];
                        if (!n.contains(s._latlng)) continue;
                        e && (s._backupLatlng = s.getLatLng(), s.setLatLng(e), s.setOpacity(0)), L.FeatureGroup.prototype.addLayer.call(r._group, s)
                    }
                }, function (t) {
                    t._addToMap(e)
                })
            },
            _recursivelyRestoreChildPositions: function (e) {
                for (var t = this._markers.length - 1; t >= 0; t--) {
                    var n = this._markers[t];
                    n._backupLatlng && (n.setLatLng(n._backupLatlng), delete n._backupLatlng)
                }
                if (e - 1 === this._zoom)
                    for (var r = this._childClusters.length - 1; r >= 0; r--) this._childClusters[r]._restorePosition();
                else
                    for (var i = this._childClusters.length - 1; i >= 0; i--) this._childClusters[i]._recursivelyRestoreChildPositions(e)
            },
            _restorePosition: function () {
                this._backupLatlng && (this.setLatLng(this._backupLatlng), delete this._backupLatlng)
            },
            _recursivelyRemoveChildrenFromMap: function (e, t, n) {
                var r, i;
                this._recursively(e, -1, t - 1, function (e) {
                    for (i = e._markers.length - 1; i >= 0; i--) {
                        r = e._markers[i];
                        if (!n || !n.contains(r._latlng)) L.FeatureGroup.prototype.removeLayer.call(e._group, r), r.setOpacity(1)
                    }
                }, function (e) {
                    for (i = e._childClusters.length - 1; i >= 0; i--) {
                        r = e._childClusters[i];
                        if (!n || !n.contains(r._latlng)) L.FeatureGroup.prototype.removeLayer.call(e._group, r), r.setOpacity(1)
                    }
                })
            },
            _recursively: function (e, t, n, r, i) {
                var s = this._childClusters,
                    o = this._zoom,
                    u, a;
                if (t > o)
                    for (u = s.length - 1; u >= 0; u--) a = s[u], e.intersects(a._bounds) && a._recursively(e, t, n, r, i);
                else {
                    r && r(this), i && this._zoom === n && i(this);
                    if (n > o)
                        for (u = s.length - 1; u >= 0; u--) a = s[u], e.intersects(a._bounds) && a._recursively(e, t, n, r, i)
                }
            },
            _recalculateBounds: function () {
                var e = this._markers,
                    t = this._childClusters,
                    n;
                this._bounds = new L.LatLngBounds, delete this._wLatLng;
                for (n = e.length - 1; n >= 0; n--) this._expandBounds(e[n]);
                for (n = t.length - 1; n >= 0; n--) this._expandBounds(t[n])
            },
            _isSingleParent: function () {
                return this._childClusters.length > 0 && this._childClusters[0]._childCount === this._childCount
            }
        }), L.DistanceGrid = function (e) {
            this._cellSize = e, this._sqCellSize = e * e, this._grid = {}, this._objectPoint = {}
        }, L.DistanceGrid.prototype = {
            addObject: function (e, t) {
                var n = this._getCoord(t.x),
                    r = this._getCoord(t.y),
                    i = this._grid,
                    s = i[r] = i[r] || {},
                    o = s[n] = s[n] || [],
                    u = L.Util.stamp(e);
                this._objectPoint[u] = t, o.push(e)
            },
            updateObject: function (e, t) {
                this.removeObject(e), this.addObject(e, t)
            },
            removeObject: function (e, t) {
                var n = this._getCoord(t.x),
                    r = this._getCoord(t.y),
                    i = this._grid,
                    s = i[r] = i[r] || {},
                    o = s[n] = s[n] || [],
                    u, a;
                delete this._objectPoint[L.Util.stamp(e)];
                for (u = 0, a = o.length; u < a; u++)
                    if (o[u] === e) return o.splice(u, 1), a === 1 && delete s[n], !0
            },
            eachObject: function (e, t) {
                var n, r, i, s, o, u, a, f = this._grid;
                for (n in f)
                    if (f.hasOwnProperty(n)) {
                        o = f[n];
                        for (r in o)
                            if (o.hasOwnProperty(r)) {
                                u = o[r];
                                for (i = 0, s = u.length; i < s; i++) a = e.call(t, u[i]), a && (i--, s--)
                            }
                    }
            },
            getNearObject: function (e) {
                var t = this._getCoord(e.x),
                    n = this._getCoord(e.y),
                    r, i, s, o, u, a, f, l, c = this._objectPoint,
                    h = this._sqCellSize,
                    p = null;
                for (r = n - 1; r <= n + 1; r++) {
                    o = this._grid[r];
                    if (o)
                        for (i = t - 1; i <= t + 1; i++) {
                            u = o[i];
                            if (u)
                                for (s = 0, a = u.length; s < a; s++) f = u[s], l = this._sqDist(c[L.Util.stamp(f)], e), l < h && (h = l, p = f)
                        }
                }
                return p
            },
            _getCoord: function (e) {
                return Math.floor(e / this._cellSize)
            },
            _sqDist: function (e, t) {
                var n = t.x - e.x,
                    r = t.y - e.y;
                return n * n + r * r
            }
        },
        function () {
            L.QuickHull = {
                getDistant: function (e, t) {
                    var n = t[1].lat - t[0].lat,
                        r = t[0].lng - t[1].lng;
                    return r * (e.lat - t[0].lat) + n * (e.lng - t[0].lng)
                },
                findMostDistantPointFromBaseLine: function (e, t) {
                    var n = 0,
                        r = null,
                        i = [],
                        s, o, u;
                    for (s = t.length - 1; s >= 0; s--) {
                        o = t[s], u = this.getDistant(o, e);
                        if (!(u > 0)) continue;
                        i.push(o), u > n && (n = u, r = o)
                    }
                    return {
                        maxPoint: r,
                        newPoints: i
                    }
                },
                buildConvexHull: function (e, t) {
                    var n = [],
                        r = this.findMostDistantPointFromBaseLine(e, t);
                    return r.maxPoint ? (n = n.concat(this.buildConvexHull([e[0], r.maxPoint], r.newPoints)), n = n.concat(this.buildConvexHull([r.maxPoint, e[1]], r.newPoints)), n) : [e]
                },
                getConvexHull: function (e) {
                    var t = !1,
                        n = !1,
                        r = null,
                        i = null,
                        s;
                    for (s = e.length - 1; s >= 0; s--) {
                        var o = e[s];
                        if (t === !1 || o.lat > t) r = o, t = o.lat;
                        if (n === !1 || o.lat < n) i = o, n = o.lat
                    }
                    var u = [].concat(this.buildConvexHull([i, r], e), this.buildConvexHull([r, i], e));
                    return u
                }
            }
        }(), L.MarkerCluster.include({
            getConvexHull: function () {
                var e = this.getAllChildMarkers(),
                    t = [],
                    n = [],
                    r, i, s;
                for (s = e.length - 1; s >= 0; s--) i = e[s].getLatLng(), t.push(i);
                r = L.QuickHull.getConvexHull(t);
                for (s = r.length - 1; s >= 0; s--) n.push(r[s][0]);
                return n
            }
        }), L.MarkerCluster.include({
            _2PI: Math.PI * 2,
            _circleFootSeparation: 25,
            _circleStartAngle: Math.PI / 6,
            _spiralFootSeparation: 28,
            _spiralLengthStart: 11,
            _spiralLengthFactor: 5,
            _circleSpiralSwitchover: 9,
            spiderfy: function () {
                if (this._group._spiderfied === this || this._group._inZoomAnimation) return;
                var e = this.getAllChildMarkers(),
                    t = this._group,
                    n = t._map,
                    r = n.latLngToLayerPoint(this._latlng),
                    i;
                this._group._unspiderfy(), this._group._spiderfied = this, e.length >= this._circleSpiralSwitchover ? i = this._generatePointsSpiral(e.length, r) : (r.y += 10, i = this._generatePointsCircle(e.length, r)), this._animationSpiderfy(e, i)
            },
            unspiderfy: function (e) {
                if (this._group._inZoomAnimation) return;
                this._animationUnspiderfy(e), this._group._spiderfied = null
            },
            _generatePointsCircle: function (e, t) {
                var n = this._circleFootSeparation * (2 + e),
                    r = n / this._2PI,
                    i = this._2PI / e,
                    s = [],
                    o, u;
                s.length = e;
                for (o = e - 1; o >= 0; o--) u = this._circleStartAngle + o * i, s[o] = (new L.Point(t.x + r * Math.cos(u), t.y + r * Math.sin(u)))._round();
                return s
            },
            _generatePointsSpiral: function (e, t) {
                var n = this._spiralLengthStart,
                    r = 0,
                    i = [],
                    s;
                i.length = e;
                for (s = e - 1; s >= 0; s--) r += this._spiralFootSeparation / n + s * 5e-4, i[s] = (new L.Point(t.x + n * Math.cos(r), t.y + n * Math.sin(r)))._round(), n += this._2PI * this._spiralLengthFactor / r;
                return i
            }
        }), L.MarkerCluster.include(L.DomUtil.TRANSITION ? {
            _animationSpiderfy: function (e, t) {
                var n = this,
                    r = this._group,
                    i = r._map,
                    s = i.latLngToLayerPoint(this._latlng),
                    o, u, a, f;
                for (o = e.length - 1; o >= 0; o--) u = e[o], u.setZIndexOffset(1e6), u.setOpacity(0), L.FeatureGroup.prototype.addLayer.call(r, u), u._setPos(s);
                r._forceLayout(), r._animationStart();
                var l = L.Path.SVG ? 0 : .3,
                    c = L.Path.SVG_NS;
                for (o = e.length - 1; o >= 0; o--) {
                    f = i.layerPointToLatLng(t[o]), u = e[o], u._preSpiderfyLatlng = u._latlng, u.setLatLng(f), u.setOpacity(1), a = new L.Polyline([n._latlng, f], {
                        weight: 1.5,
                        color: "#222",
                        opacity: l
                    }), i.addLayer(a), u._spiderLeg = a;
                    if (!L.Path.SVG) continue;
                    var h = a._path.getTotalLength();
                    a._path.setAttribute("stroke-dasharray", h + "," + h);
                    var p = document.createElementNS(c, "animate");
                    p.setAttribute("attributeName", "stroke-dashoffset"), p.setAttribute("begin", "indefinite"), p.setAttribute("from", h), p.setAttribute("to", 0), p.setAttribute("dur", .25), a._path.appendChild(p), p.beginElement(), p = document.createElementNS(c, "animate"), p.setAttribute("attributeName", "stroke-opacity"), p.setAttribute("attributeName", "stroke-opacity"), p.setAttribute("begin", "indefinite"), p.setAttribute("from", 0), p.setAttribute("to", .5), p.setAttribute("dur", .25), a._path.appendChild(p), p.beginElement()
                }
                n.setOpacity(.3);
                if (L.Path.SVG) {
                    this._group._forceLayout();
                    for (o = e.length - 1; o >= 0; o--) u = e[o]._spiderLeg, u.options.opacity = .5, u._path.setAttribute("stroke-opacity", .5)
                }
                setTimeout(function () {
                    r._animationEnd(), r.fire("spiderfied")
                }, 250)
            },
            _animationUnspiderfy: function (e) {
                var t = this._group,
                    n = t._map,
                    r = e ? n._latLngToNewLayerPoint(this._latlng, e.zoom, e.center) : n.latLngToLayerPoint(this._latlng),
                    i = this.getAllChildMarkers(),
                    s = L.Path.SVG,
                    o, u, a;
                t._animationStart(), this.setOpacity(1);
                for (u = i.length - 1; u >= 0; u--) o = i[u], o.setLatLng(o._preSpiderfyLatlng), delete o._preSpiderfyLatlng, o._setPos(r), o.setOpacity(0), s && (a = o._spiderLeg._path.childNodes[0], a.setAttribute("to", a.getAttribute("from")), a.setAttribute("from", 0), a.beginElement(), a = o._spiderLeg._path.childNodes[1], a.setAttribute("from", .5), a.setAttribute("to", 0), a.setAttribute("stroke-opacity", 0), a.beginElement(), o._spiderLeg._path.setAttribute("stroke-opacity", 0));
                setTimeout(function () {
                    var e = 0;
                    for (u = i.length - 1; u >= 0; u--) o = i[u], o._spiderLeg && e++;
                    for (u = i.length - 1; u >= 0; u--) {
                        o = i[u];
                        if (!o._spiderLeg) continue;
                        o.setOpacity(1), o.setZIndexOffset(0), e > 1 && L.FeatureGroup.prototype.removeLayer.call(t, o), n.removeLayer(o._spiderLeg), delete o._spiderLeg
                    }
                    t._animationEnd()
                }, 250)
            }
        } : {
            _animationSpiderfy: function (e, t) {
                var n = this._group,
                    r = n._map,
                    i, s, o, u;
                for (i = e.length - 1; i >= 0; i--) u = r.layerPointToLatLng(t[i]), s = e[i], s._preSpiderfyLatlng = s._latlng, s.setLatLng(u), s.setZIndexOffset(1e6), L.FeatureGroup.prototype.addLayer.call(n, s), o = new L.Polyline([this._latlng, u], {
                    weight: 1.5,
                    color: "#222"
                }), r.addLayer(o), s._spiderLeg = o;
                this.setOpacity(.3), n.fire("spiderfied")
            },
            _animationUnspiderfy: function () {
                var e = this._group,
                    t = e._map,
                    n = this.getAllChildMarkers(),
                    r, i;
                this.setOpacity(1);
                for (i = n.length - 1; i >= 0; i--) r = n[i], L.FeatureGroup.prototype.removeLayer.call(e, r), r.setLatLng(r._preSpiderfyLatlng), delete r._preSpiderfyLatlng, r.setZIndexOffset(0), t.removeLayer(r._spiderLeg), delete r._spiderLeg
            }
        }), L.MarkerClusterGroup.include({
            _spiderfied: null,
            _spiderfierOnAdd: function () {
                this._map.on("click", this._unspiderfyWrapper, this), this._map.options.zoomAnimation ? this._map.on("zoomstart", this._unspiderfyZoomStart, this) : this._map.on("zoomend", this._unspiderfyWrapper, this), L.Path.SVG && !L.Browser.touch && this._map._initPathRoot()
            },
            _spiderfierOnRemove: function () {
                this._map.off("click", this._unspiderfyWrapper, this), this._map.off("zoomstart", this._unspiderfyZoomStart, this), this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._unspiderfy()
            },
            _unspiderfyZoomStart: function () {
                if (!this._map) return;
                this._map.on("zoomanim", this._unspiderfyZoomAnim, this)
            },
            _unspiderfyZoomAnim: function (e) {
                if (L.DomUtil.hasClass(this._map._mapPane, "leaflet-touching")) return;
                this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._unspiderfy(e)
            },
            _unspiderfyWrapper: function () {
                this._unspiderfy()
            },
            _unspiderfy: function (e) {
                this._spiderfied && this._spiderfied.unspiderfy(e)
            },
            _unspiderfyLayer: function (e) {
                e._spiderLeg && (L.FeatureGroup.prototype.removeLayer.call(this, e), e.setOpacity(1), e.setZIndexOffset(0), this._map.removeLayer(e._spiderLeg), delete e._spiderLeg)
            }
        })
})(this);