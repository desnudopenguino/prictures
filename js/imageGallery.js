/*imageGallery.js
 *Author: Adam Townsend
 *This JavaScript is made as a simple image gallery
 *script that can be implemented on a server.  It loads an xml file that contains information for a gallery
 *
 *UPDATES:
 *
 *05/13/2012
 *LOTS OF WORK - in image navigation build, and functional, though not super pretty
 *	image resizing to fit page in height & width in the making right now
 *	due to to much JQuery, page is getting slow.  Probably Image() objects
 *	Also warn about larger images increasing load time
 *	image counter loader on loading screen
 *	large image positioning needs work with the new image object
 *	create a dropdown for the gallery description
 *	page counter under thumb section
 *	make everything javascript, so that the code can be used as a JQuery plug-in!
 *	removed all anchor tags, now it is all on-clicks and stuff from js, no hrefs! (clean url)i
 *	got large image to scale better (still needs height fixed)
 *	back and next buttons look good and work correctly
 *	for things called multiple times, set them equal to something in the functions
 *		and other code cleaning!
 *	more suggestions?
 *06/02/2012
 *image nav is set to the edges of the div, not the actual image.
 *trying to get the image nav to work 
 *using the click() jquery method is terribly inefficient.
 *
 *06/07/2012
 *moved the back and next buttons for the image so that it is more "concrete" in the page
 *need to work on the resizing again for some reason
 *change loading stuff to just be a little tap at the top of the page
 *
 *11/25/2012
 *removed the preloading stuff
 *removed the onload from the js, it is now pulled from the html (body onload)
 *page loads xml from onload call
 *loads the entire page dynamically, no thing is on the page other than the head content and onload on the body tag
 *work on more efficiency coding to make sure it works fast
 *make it into a jquery plugin***
 *
 *11/26/2012
 *working on jquery pluginifying it!!!
 *
 *11/26/2012
 *first iteration of jquery plugin stuff done
 * nearly all functionality works
 * missing dynamic resizing, but gallery loads, and all other functionality exists.
 * can start with a different image than the first image
 *
 *11/17/2012
 * moving functions into the right scope (helpers vs methods)
 * new set of more complete comments
 * need to do some cleaning, maybe applying the jquery calls better, and removing the 
 * specific parts from the js
 * function naming convention needs to change
 * build____ : builds the html & returns it (helper)
 * load____ : loads something from another file (helper)
 * show____ : applies the html to the DOM (method)
 * prev/next____ : previous/next thing (change from last) (method)
 * removed prev/next image, replaced it with showimage calls.  might make a helper that generates that data
 * loads to specific container (not just body)
 *
 * 11/30/2012
 * create the Gallery object inside the js (use prototype)
 *
 * 12/03/12
 * now scales better to the container
 * make the number of images on the left scale to the size of the window (maybe) so that the gallery fits
 * into the size allotted (overflow hidden & some other crazy math stuff)
 */


/**********************Code Begin!**************************/
(function( $ ) {

	//variabled that aren't used/controlled by the user
	var imageCounter = 0; //counts the number of images for the home pages
	var gal; // individual gallery

	/* default settings for plugin */
	var defaults = {
		xmlFile : 'images.xml', // the xml file to be loaded
		startImg : 0 // the start image for the large image
	}

	/* settings for plugin */
	var settings = {}

	/* Method list
	 * this object contains all the public functions that a user can call from the html
	 */
	var methods = {

		/* init:
		 * args:
		 *	- options : user-defined settings for the plugin
		 * returns:
		 *	- NONE
		 * applies options to settings
		 * calls  showDOM()
		 * calls  loadXML()
		 */
		init : function (options) {
			settings = $.extend({}, defaults, options); // set the settings for the plugin
			return this.each(function () { //get all calls to function in html
				var $element = $(this), // JQuery DOM
				element = this; // actual DOM

				$(this).prictures('showDOM');
				helpers.loadXML(); //loads the xml file
			});
		},

		/* showDOM:
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- NONE
		 * appends the html framework to the container
		 */
		showDOM : function () {
			$(this).append(helpers.buildDOM());
		},

		/* showImage:
		 * args:
		 *	- imageNumber : number of image in the list
		 * returns:
		 *	- NONE
		 * clears the image content then pushes new image content into image div
		 * also sets the next and back for the image (should split these up probably?)
		 */
		showImage : function(imageNumber) {

			//clean image div
			$("#image img").remove();
			$("#caption").remove();
	
			//load new content
			$('#image').append(helpers.buildImage(imageNumber));
			$('#image').append(helpers.buildCaption(imageNumber));

			var nextImg = parseInt(imageNumber), prevImg = parseInt(imageNumber);
			var galLength = gal.getLength();
			//apply the click functionality easy and faster than jq click() method
			if(nextImg < galLength-1) {
				nextImg++;
			}
			else {
				nextImg = 0;
			}
			$('#next').attr('onclick',"$(this).prictures('showImage',"+nextImg+")");

			if(prevImg > 0) {
				prevImg--;
			}
			else {
				prevImg = galLength -1;
			}
			
			$('#back').attr('onclick',"$(this).prictures('showImage',"+prevImg+")");
		},

		/* prevPage:
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- NONE
		 * loads the previous page in the list of pages for the gallery
		 */
		prevPage : function() {
			var pageSize = parseInt(gal.getPageSize()); // gets the pagesize
			var galLength = parseInt(gal.getLength()); // gets the gallery length
			imageCounter-=pageSize;
			if(imageCounter < 0) { //makes sure previous loops around to end
				if(galLength%pageSize==0) {
					imageCounter = galLength-pageSize;
				}
				else {
					imageCounter = (galLength - galLength%pageSize);
				}
			}
			$(this).prictures('showGallery');
		},

		/* nextPage:
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- NONE
		 * loads the next page in the list of pages for the gallery
		 */
		nextPage : function() { 
			var pageSize = gal.getPageSize();
			imageCounter+=parseInt(pageSize);
			if(imageCounter >= gal.getLength()) { // makes sure that next loops around to start
				imageCounter=0;
			}
			$(this).prictures('showGallery');
		},

		/* showGallery:
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- NONE
		 * empties the imageList builds a new navigation and loads new content
		 */
		showGallery : function() {
			
			$("#imageList").empty(); //empties imagelist
			//checks if the pagesize is set to load the nav
			if(gal.getPageSize() != null) {
				$("#imageList").append(helpers.buildNav());
			}
			$('#imageList').append(helpers.buildGallery(imageCounter));
		},

		/* showTitle:
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- NONE
		 * clears title and loads new content
		 */
		showTitle : function() {
			$("#title").empty(); // empties container
			$("#title").append(helpers.buildTitle());
		},

		/* hideContent
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- NONE
		 * hides all the content under the gallery
		 */

		hideGallery : function() {
			$('#imageList').toggle();
			$('#image').toggle();
		}
	};

	/* helper functions, not visible to the public stuff
	 * so put all the internal only functions in here
	 * call helper methods like this: helpers.methodname(args);
	 */
	var helpers = {

		/* buildCaption:
		 * args:
		 * 	- imgNum : the number of the image to be captioned
		 * returns:
		 * 	- p : html element that contains the caption for the image
		 * builds and returns the caption for the large image to be shown
		 */
		buildCaption : function(imgNum) {
			var desc = gal.getImgDsc(imgNum);	
			if(desc != null) {
				console.log(desc);
				var txt = document.createTextNode(desc);
				var p = document.createElement("p");
				p.setAttribute('id',"caption");
				p.appendChild(txt);
				return p;
			}
		},

		/* loadXML:
		 * args:
		 *	- NONE
		 * returns:
		 *	- NONE
		 * makes an ajax call to load the xml from the xmlfile
		 * if xml loading succeedes, loads the title, gallery, and the start image
		 */
		loadXML: function () {
			$.ajax({
		        type: "GET",
				url : settings['xmlFile'],
				dataType: "xml",
				success: function(xml) {
					$(xml).find('gallery').each(function() {
						gal = helpers.loadGallery($(this));
					});
					//build content now!
					$(this).prictures('showTitle');
					$(this).prictures('showGallery');
					$(this).prictures('showImage',settings['startImg']);
				}
			});
		},
	
		/* buildImage:
		 * args:
		 * 	- imgNum : number of the image to be built
		 * returns:
		 * 	- image : the image object
		 * gets the image from the gallery object, 
		 * sets the size for the window, and returns it
		 */
		buildImage : function(imgNum) {
			var image = gal.getImage(imgNum);
			//$(this).prictures('setSize',image);	
			helpers.setSize(image);
			return image;
		},
	
		/* buildGallery:
		 * args:
		 *	- startImage : the first image in the gallery page
		 * returns: 
		 * 	- imageList : the html for the galler
		 * builds and returns an unordered list of images for the gallery
		 */
		buildGallery : function(startImage) {
			//pull data and html-ize it!
			var galLength = gal.getLength();
			var pageSize = gal.getPageSize();
			var imageList = document.createElement('ul');
			for(index = startImage; index < galLength; index++) {
				var li = document.createElement('li');
				var image = gal.getThumb(index);
				image.setAttribute('onclick',"$(this).prictures('showImage',"+index+")");
				li.appendChild(image);
				imageList.appendChild(li);
				if((index+1)%pageSize==0){
					break;
				}
			}
			return imageList;
		},
		
		/* loadGallery:
		 * args:
		 *	- xmlData : the xml file for the image gallery
		 * returns:
		 *	- gal : the Gallery object built from the xml file
		 * loads the xml data into a Gallery object and returns the object
		 */
		loadGallery : function(xmlData) {
			var gal = new Gallery();
			//load the title
			gal.setTitle(xmlData.attr('name'));
			//load directories
			gal.setImageDir(xmlData.attr('images'));
			gal.setThumbDir(xmlData.attr('thumbs'));
			gal.setPageSize(xmlData.attr('count'));
			gal.setThumbPrefix(xmlData.attr('prefix'));
			//load images and info for them
			xmlData.find('image').each(function () {
				gal.addImage($(this).text(),$(this).attr('desc'));
			});
			return gal;
		},
		
		/* buildDOM:
		 * args:
		 *	- NONE
		 * returns:
		 *	- NONE
		 * builds the HTML scaffolding for the gallery
		 */
		buildDOM : function() {
			//get dom
			var body = document.createElement('div');
		
			//title div
			div = document.createElement('div');
			div.setAttribute('id',"title");
			div.setAttribute('onclick',"$(this).prictures('hideGallery');");
			body.appendChild(div);
		
			//image list div
		
			div = document.createElement('div');
			div.setAttribute('id',"imageList");
			body.appendChild(div);
		
			//image div
			div = document.createElement('div');
			div.setAttribute('id',"image");
		
			var p = document.createElement('p');
			p.setAttribute('id',"back");
			tn = document.createTextNode("<");
			p.appendChild(tn);
			div.appendChild(p);
		
			p = document.createElement('p');
			p.setAttribute('id',"next");
			tn = document.createTextNode(">");
			p.appendChild(tn);
			div.appendChild(p);
		
			body.appendChild(div);
			body.setAttribute('id',"prictures");
			return body;
		},
		
		/* buildTitle:
		 * args:
		 * 	- NONE
		 * returns:
		 *	- h1 : html formatted title
		 * builds the title for the image gallery
		 */
		buildTitle : function() {
			var title = gal.title;
			var h1 = document.createElement("h1");
			var titleText = document.createTextNode(title);
			h1.appendChild(titleText);
			return h1;
		},
		
		/* setSize:
		 * args:
		 * 	- _image : the image object to be modified
		 * returns:
		 * 	- NONE
		 * alters the size of the large image depending on the screen size
		 * NOTE: needs some rethinking and such to get it working a little better.
		 */
		setSize : function(_image) {
			var image = _image;
			var iHeight = image.height;
			var iWidth = image.width;
			//check wether image width or height is bigger
			if(iWidth > iHeight) {
				//set size of image according to width (50%)
				var ratio = (Math.floor($('#prictures').width() * 0.50))/iWidth;
				var width = Math.floor(ratio*iWidth);
				width = width * 1;
				var height = Math.floor(ratio*iHeight);
				height = height * 1;
				image.setAttribute('width',width);
				image.setAttribute('height',height);
				console.log($('#prictures').width());
			}
			else {
				//set size of image according to height (screen height - some size)
				var ratio = (Math.floor($('#prictures').height() - 100))/iHeight;
				var width = Math.floor(ratio*iWidth);
				width = width * 1;
				var height = Math.floor(ratio*iHeight);
				height = height * 1;
				image.setAttribute('width',width);
				image.setAttribute('height',height); 
				console.log($('#prictures').width());
			}
		},
		
		/* buildNav:
		 * args:
		 * 	- NONE
		 * returns:
		 * 	- para : the html for the gallery page navigation
		 * generates and returns the navigation for the gallery "pages"
		 */
		buildNav : function() {
			var para = document.createElement('p');	
			
			var backSpan = document.createElement('span');
			backSpan.setAttribute('class',"link");
			
			var nextSpan = document.createElement('span');
			nextSpan.setAttribute('class',"link");
			
			backText = document.createTextNode('Back');
			
			backSpan.appendChild(backText)
		
			nextText = document.createTextNode('Next');
			
			nextSpan.appendChild(nextText)
			
			backSpan.setAttribute('onclick',"$(this).prictures('prevPage')");
			nextSpan.setAttribute('onclick',"$(this).prictures('nextPage')");
			
			para.appendChild(backSpan);
			para.appendChild(nextSpan);
			
			return para;
		},

	}
	
	/* the namespace declaration
	 * allows to call the prictures plugin from the html
	 */
	$.fn.prictures = function ( method ) {
		if(methods[method]) {
			return methods[method].apply (this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error ('Method ' + method + ' does not exist on jQuery.prictures' );
		}
	};

/***Gallery.js
 * this is a prototype class for image galleries to hold the data
 * it contains STRICTLY data for a gallery, no formatting or html stuff
 * Attributes:
 *	- title
 *	- image directory
 *	- thumb directory
 *	- images array (contains objects)
 *	- page size (number of images per page
 *an attempt to build image objects in Gallery rather than other parts
 * build an image object that includes Image() objects, as well as descriptions, ect...
 */
 
 //constructor, loads data
 function Gallery() {
	
 	this.images = new Array();
	 
	//title mutator
	this.setTitle = function(_title) {
		if(_title != null) {
			this.title = _title;
		}
		else {
			this.title = "Image Gallery";
		}
	}
	 
	//image directory mutator
	this.setImageDir = function(_imageDir) {
		if(_imageDir!= null) {
			this.imageDir = _imageDir;
		}
		else {
			this.imageDir = ".";
		}
	}
	
	//thumb directory mutator
	this.setThumbDir = function(_thumbDir) {
		if(_thumbDir != null) {
			this.thumbDir = _thumbDir;
		}
		else {
			this.thumbDir = ".";
		}
	}

	//thumb prefix
	this.setThumbPrefix = function(_prefix) {
		if(_prefix != null) {
			this.thumbPrefix = _prefix;
		}
		else {
			this.thumbPrefix = "";
		}
	}

	//get thumb prefix
	this.getThumbPrefix = function() {
		return this.thumbPrefix;
	}
	
	//add Img object to images array
	this.addImage = function(_imgURL, _desc) {
		//create full image and thumb objects
		var image = new Image();
		image.src = this.getImageDir() +"/"+_imgURL;
		
		var thumb = new Image();
		thumb.src = this.getThumbDir() +"/"+this.getThumbPrefix()+_imgURL;
		var img = {};
	
		if(_desc != null) {
			image.setAttribute('title',_desc);
			image.setAttribute('alt',_desc);
			thumb.setAttribute('alt',_desc);
			img.description = _desc;
		}
		img.image = image;
		img.thumb = thumb;

		this.images.push(img);
	}

	//sets the number of images per page
	this.setPageSize = function(_pageSize) {
		this.pageSize = _pageSize;
	}
	
	//get as imaje object from the image list
	this.getImage = function(_id) {
		return this.images[_id].image;
	}

	this.getThumb = function(_id) {
		return this.images[_id].thumb;
	}

	//get the image description
	this.getImgDsc = function(_id) {
		return this.images[_id].description;
	}

	//get page size
	this.getPageSize = function() {
		return this.pageSize;
	}

	//get image dir
	this.getImageDir = function() {
		return this.imageDir;
	}
	
	//get thumb dir
	this.getThumbDir = function() {
		return this.thumbDir;
	}

	//get length of gallery
	this.getLength = function() {
		return this.images.length;
	}
}
}) ( jQuery );
