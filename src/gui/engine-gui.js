class RaycasterEngineGUI {

    constructor() {
        this.guiWrapper = null;
        this.guiToolbar = null;
        this.initialLayout = null;
        this.guiCtx = null;
        this.layouts = {};
        this.selectedLayout = null;
        this.assets = {};
        this.selectedAsset = null;

        this.gridCellWidth = 0;
        this.gridCellHeight = 0;
    }

    /**
     * 
     * @param {Array<Array<number>>} layout 
     * @param {'wall' | 'floor' | 'ceil'} name 
     */
    addLayout(layout, name) {
        if (this.guiWrapper === null) {
            throw Error("GUI wrapper is not initialized");
        }

        if (this.gridCellWidth !== 0 && this.gridCellHeight !== 0 && 
            this.gridCellWidth !== parseInt(this.guiWrapper.width / layout[0].length) && 
            this.gridCellHeight !== parseInt(this.guiWrapper.height / layout.length)) {
            throw Error("Layout size must be equal to the previous layouts size");
        }

        this.layouts[name] = layout;
        if (this.selectedLayout === null) {
            this.selectedLayout = name;
        }

        this.gridCellWidth = parseInt(this.guiWrapper.width / layout[0].length);
        this.gridCellHeight = parseInt(this.guiWrapper.height / layout.length);
    }

    addAsset(id, asset) {
        this.assets[id] = asset;
    }

    guiAssetLoader(onChange) {
        const assetLoaderWrapper = document.createElement("div");
        
        const assetLoader = document.createElement("input");
        assetLoader.type = "file";
        assetLoader.style.display = "none";
        assetLoader.accept = "image/*";
        assetLoader.multiple = true;
        assetLoader.id = `raycaster-engine-gui-asset-loader-${Math.random().toString(36).substring(2, 15)}`;

        const assetLoaderLabel = document.createElement("label");
        assetLoaderLabel.textContent = "📁 Asset Loader";
        this.#guiElementStyle(assetLoaderLabel);
        assetLoaderLabel.setAttribute("for", assetLoader.id);
        
        const progressBar = document.createElement("div");
        progressBar.style.width = "100%";
        progressBar.style.height = "3px";
        progressBar.style.backgroundColor = "rgba(255,255,255,0.2)";
        progressBar.style.borderRadius = "2px";
        progressBar.style.marginTop = "5px";
        progressBar.style.overflow = "hidden";
        progressBar.style.display = "none";
        
        const progressFill = document.createElement("div");
        progressFill.style.height = "100%";
        progressFill.style.backgroundColor = "#4CAF50";
        progressFill.style.width = "0%";
        progressFill.style.transition = "width 0.3s ease";
        progressBar.appendChild(progressFill);
        
        assetLoader.onchange = async (event) => {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;
            
            progressBar.style.display = "block";
            progressFill.style.width = "0%";
            
            try {
                const loadPromises = files.map((file, index) => {
                    return new Promise((resolve, reject) => {
                        if (!file.type.startsWith('image/')) {
                            reject(new Error(`${file.name} is not an image`));
                            return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                            const image = new Image();
                            image.onload = () => {
                                const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                                const assetData = {
                                    id: assetId,
                                    name: file.name,
                                    image: image,
                                    src: readerEvent.target.result,
                                    size: file.size,
                                    dimensions: `${image.width}x${image.height}`,
                                    uploadDate: new Date().toLocaleString(),
                                    type: file.type
                                };
                                
                                this.assets[index] = assetData;
                                
                                const progress = ((index + 1) / files.length) * 100;
                                progressFill.style.width = `${progress}%`;
                                
                                resolve(assetData);
                            };
                            
                            image.onerror = () => {
                                reject(new Error(`Failed to load image: ${file.name}`));
                            };
                            
                            image.src = readerEvent.target.result;
                        };
                        
                        reader.onerror = () => {
                            reject(new Error(`Failed to read file: ${file.name}`));
                        };
                        
                        reader.readAsDataURL(file);
                    });
                });
                
                const loadedAssets = await Promise.all(loadPromises);

                console.log(this.assets);
                
                this.#updateAssetsList();
                
                
                if (onChange) {
                    loadedAssets.forEach(asset => onChange(asset));
                }
                
                assetLoaderLabel.style.color = "#4CAF50";
                assetLoaderLabel.textContent = `✅ ${loadedAssets.length} asset loaded`;
                setTimeout(() => {
                    assetLoaderLabel.style.color = "white";
                    assetLoaderLabel.textContent = "📁 Asset Loader";
                }, 2000);
                
            } catch (error) {
                console.error("Asset loading error:", error);
                
                assetLoaderLabel.style.color = "#F44336";
                assetLoaderLabel.textContent = "❌ Loading error";
                setTimeout(() => {
                    assetLoaderLabel.style.color = "white";
                    assetLoaderLabel.textContent = "📁 Asset Loader";
                }, 3000);
                
            } finally {
                setTimeout(() => {
                    progressBar.style.display = "none";
                    progressFill.style.width = "0%";
                }, 1000);
                
                assetLoader.value = "";
            }
        };
        
        assetLoaderWrapper.appendChild(assetLoaderLabel);
        assetLoaderWrapper.appendChild(assetLoader);
        assetLoaderWrapper.appendChild(progressBar);
        
        return assetLoaderWrapper;
    }

    guiSelector(options, onChange) {
        const optionsList = options.map((key) => {
            return `<option value="${key}">${key}</option>`;
        });

        const selector = document.createElement("select");
        selector.id = `raycaster-engine-gui-selector-${Math.random().toString(36).substring(2, 15)}`;
        selector.onchange = onChange;
        selector.style.top = "10px";
        selector.style.right = "10px";
        this.#guiElementStyle(selector);
        selector.innerHTML = optionsList.join("");

        return selector;
    }

    #guiElementStyle(element) {
        element.style.zIndex = "1000";
        element.style.cursor = "pointer";
        element.style.width = "100%";
        element.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        element.style.color = "white";
        element.style.border = "1px solid white";
        element.style.borderRadius = "5px";
        element.style.padding = "5px";
        element.style.marginBottom = "10px";
        element.style.fontSize = "16px";
        element.style.display = "block";
    }

    #createAssetsListBlock() {
        const assetsBlock = document.createElement("div");
        assetsBlock.id = "assets-list-block";
        assetsBlock.style.marginTop = "15px";
        assetsBlock.style.marginBottom = "10px";
        assetsBlock.style.maxHeight = "400px";
        assetsBlock.style.overflowY = "auto";
        assetsBlock.style.borderTop = "2px solid #666";
        assetsBlock.style.paddingTop = "10px";
        assetsBlock.style.overflowX = "hidden";
        
        const assetsList = document.createElement("div");
        assetsList.id = "assets-list";
        assetsList.style.display = "flex";
        assetsList.style.flexDirection = "column";
        assetsList.style.gap = "3px";
        assetsList.style.padding = "5px 0";
        
        
        
        assetsBlock.appendChild(assetsList);
        
        return assetsBlock;
    }

    #updateAssetsList() {
        const assetsList = document.getElementById("assets-list");
        
        if (!assetsList) return;
        
        assetsList.innerHTML = "";
        
        const assetEntries = Object.entries(this.assets);

        console.log(assetEntries);
        
        
        const fragment = document.createDocumentFragment();
        
        assetEntries.forEach(([assetId, asset]) => {
            const assetItem = document.createElement("div");
            assetItem.className = "asset-item";
            assetItem.dataset.assetId = assetId;
            assetItem.style.display = "flex";
            assetItem.style.alignItems = "center";
            assetItem.style.backgroundColor = "rgba(60, 60, 60, 0.5)";
            assetItem.style.border = "1px solid #555";
            assetItem.style.borderRadius = "6px";
            assetItem.style.padding = "6px";
            assetItem.style.marginBottom = "2px";
            assetItem.style.cursor = "pointer";
            assetItem.style.transition = "all 0.2s ease";
            assetItem.style.position = "relative";
            
            const preview = document.createElement("img");
            preview.src = asset.image.src;
            preview.style.width = "28px";
            preview.style.height = "28px";
            preview.style.objectFit = "cover";
            preview.style.borderRadius = "4px";
            preview.style.marginRight = "8px";
            preview.style.border = "1px solid #777";
            preview.style.flexShrink = "0";
            
            const assetInfo = document.createElement("div");
            assetInfo.style.flex = "1";
            assetInfo.style.fontSize = "9px";
            assetInfo.style.color = "white";
            assetInfo.style.lineHeight = "1.3";
            assetInfo.style.overflow = "hidden";
            
            const fileName = document.createElement("div");
            fileName.textContent = asset.name.length > 12 ? asset.name.substring(0, 9) + "..." : asset.name;
            fileName.style.fontWeight = "bold";
            fileName.style.marginBottom = "2px";
            fileName.style.whiteSpace = "nowrap";
            fileName.style.overflow = "hidden";
            fileName.style.textOverflow = "ellipsis";
            
            const dimensions = document.createElement("div");
            dimensions.textContent = asset.dimensions;
            dimensions.style.color = "#ccc";
            dimensions.style.fontSize = "8px";
            
            const fileSize = document.createElement("div");
            fileSize.textContent = `${(asset.size / 1024).toFixed(1)}KB`;
            fileSize.style.color = "#aaa";
            fileSize.style.fontSize = "7px";
            
            assetInfo.appendChild(fileName);
            assetInfo.appendChild(dimensions);
            assetInfo.appendChild(fileSize);
            
            assetItem.onmouseover = () => {
                assetItem.style.backgroundColor = "rgba(80, 80, 80, 0.7)";
                assetItem.style.borderColor = "#888";
                assetItem.style.transform = "translateX(2px)";
            };
            
            assetItem.onmouseout = () => {
                assetItem.style.backgroundColor = "rgba(60, 60, 60, 0.5)";
                assetItem.style.borderColor = "#555";
                assetItem.style.transform = "translateX(0px)";
            };
            
            assetItem.onclick = () => {
                this.selectedAsset = asset;
                this.#showAssetPreview(asset);
            };
            
            
            assetItem.appendChild(preview);
            assetItem.appendChild(assetInfo);
            
            fragment.appendChild(assetItem);
        });
        
        assetsList.appendChild(fragment);
    }

    #showAssetPreview(asset) {
        console.log("Asset preview:", asset);
    }

    init(width, height) {
        this.guiWrapper = document.createElement("div");
        this.guiWrapper.width = width;
        this.guiWrapper.height = height;
        this.guiWrapper.id = "raycaster-engine-gui";
        this.guiWrapper.style.position = "relative";
        this.guiWrapper.style.border = "1px solid white";
        this.guiWrapper.style.borderRadius = "5px";
        this.guiWrapper.style.display = "flex";
        this.guiWrapper.style.gap = "10px";
        document.body.appendChild(this.guiWrapper);

        const guiCanvas = document.createElement("canvas");
        guiCanvas.id = "gui";
        this.guiWrapper.appendChild(guiCanvas);
        guiCanvas.width = width;
        guiCanvas.height = height;
        guiCanvas.style.border = "1px solid white";
        guiCanvas.style.borderRadius = "5px";
        guiCanvas.style.backgroundColor = "white";
        this.guiCtx = guiCanvas.getContext("2d");

        this.guiToolbar = document.createElement("div");
        this.guiToolbar.id = "raycaster-engine-gui-toolbar";
        this.#guiElementStyle(this.guiToolbar);
        this.guiToolbar.style.width = "250px";
        this.guiToolbar.style.height = "100%";
        this.guiToolbar.style.overflowY = "auto";
        this.guiToolbar.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.guiToolbar.style.backdropFilter = "blur(5px)";
        this.guiWrapper.appendChild(this.guiToolbar);
        
        this.guiAssetList = document.createElement("div");

        guiCanvas.onmousedown = (event) => {
            this.#editTile(event);
            this.#renderLayout();
        };
    }

    addToolbarItem(item) {
        this.guiToolbar.appendChild(item);
    }
    
    render() {
        this.addToolbarItem(this.guiSelector(Object.keys(this.layouts), (event) => {
            this.selectedLayout = event.target.value;
            this.#renderLayout();
        }));

        this.addToolbarItem(this.guiAssetLoader((asset) => {
            console.log("Asset loaded:", asset.name);
        }));

        this.addToolbarItem(this.#createAssetsListBlock());

        this.#updateAssetsList();

        this.#renderLayout();
    }

    #renderLayout() {
        const layout = this.layouts[this.selectedLayout];
        this.guiCtx.clearRect(0, 0, this.guiWrapper.width, this.guiWrapper.height);
        this.guiCtx.fillStyle = "black";
        for (let row = 0; row < layout.length; row++) {
            for (let column = 0; column < layout[row].length; column++) {
                const tile = layout[row][column];
                
                this.guiCtx.strokeRect(column * this.gridCellWidth, row * this.gridCellHeight, this.gridCellWidth, this.gridCellHeight);

                //this.guiCtx.fillRect(column * this.gridCellWidth, row * this.gridCellHeight, this.gridCellWidth, this.gridCellHeight);

                if (this.assets[tile]) {
                    this.guiCtx.drawImage(this.assets[tile].image, column * this.gridCellWidth, row * this.gridCellHeight, this.gridCellWidth, this.gridCellHeight);
                }
            }
        }
    }

    #editTile(event) {
        const x = event.clientX - this.guiWrapper.offsetLeft;
        const y = event.clientY - this.guiWrapper.offsetTop;
        const column = Math.floor(x / this.gridCellWidth);
        const row = Math.floor(y / this.gridCellHeight);
        if (this.layouts[this.selectedLayout][row][column] === 0) {
            this.layouts[this.selectedLayout][row][column] = 1;
        } else {
            this.layouts[this.selectedLayout][row][column] = 0;
        }
    }
}

export default RaycasterEngineGUI;
