# Compare Jpeg vs. Basis Universal textures in KTX™ 2.0 using OGC I3S 1.2 
=======

An application based on [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/latest/) comparing Basis Universal supercompressed GPU textures in [KTX™ 2.0](https://www.khronos.org/ktx/) containers vs. Jpeg for Integrated Mesh and 3D Object layer types based on [OGC I3S 1.2](https://www.ogc.org/pressroom/pressreleases/4617) 

To compare different layers, the app expects a webscene with bookmarks named using the following convention:
[anyName]*_scene.1*  (eg. `View.1_scene.1`) - the name of a bookmark showcasing the i3s 1.6 layer.
[anyName]*_Scene.2* - (eg. `View.2_scene.2`) - the name of the corresponding bookmark showcasing the same layer in i3s 1.7.

## [Live Version](https://tamrat-b.github.io/i3sBasisKTX20/?stats=true)

## Supported URL parameters

* [webscene=id](https://3dcities.maps.arcgis.com/home/item.html?id=e6373629940b4e299ac3d49a08bc6856): Load the given webscene from the portal (default www.arcgis.com)
* portal=url: Use the given portal URL
* [animate=true](https://tamrat-b.github.io/i3sBasisKTX20?animate=true): Run through all slides in both versions once
* [stats=true](https://tamrat-b.github.io/i3sBasisKTX20/?stats=true): Display some scene statistics
