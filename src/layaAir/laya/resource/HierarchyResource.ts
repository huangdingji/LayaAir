import { LayaEnv } from "../../LayaEnv";
import { AnimationClip } from "../d3/animation/AnimationClip";
import { AnimatorController } from "../d3/component/Animator/AnimatorController";
import { Node } from "../display/Node";
import { Scene } from "../display/Scene";
import { LegacyUIParser } from "../loaders/LegacyUIParser";
import { Resource } from "./Resource";

export class Prefab extends Resource {
    public readonly version: number;
    protected _deps: Array<Resource>;

    /**@private */
    json: any; //兼容2.0

    constructor(version?: number) {
        super();

        this.version = version;
        this._deps = [];
    }

    /**
     * 创建实例
     */
    create(options?: Record<string, any>, errors?: Array<any>): Node {
        if (this.json) //兼容2.0
            return LegacyUIParser.createByData(null, this.json);
        else
            return null;
    }

    get deps(): ReadonlyArray<Resource> {
        return this._deps;
    }

    addDep(res: Resource) {
        if (res instanceof Resource) {
            res._addReference();
            this._deps.push(res);
            if (res instanceof AnimatorController) {
                if (res.data && res.data.controllerLayers) {
                    for (let i = 0; i < res.data.controllerLayers.length; i++) {
                        let layer = res.data.controllerLayers[i];
                        for (let j = 0; j < layer.states.length; j++) {
                            let state = layer.states[j];
                            if (state.clip && state.clip instanceof AnimationClip) {
                                state.clip._addReference()
                            }
                        }
                    }
                }
            }
            if (!LayaEnv.isPlaying && (res instanceof Prefab))
                res.on("obsolute", this, this.onDepObsolute);
        }
    }

    addDeps(resArr: Array<Resource>) {
        for (let res of resArr) {
            if (res instanceof Resource) {
                if (res instanceof AnimatorController) {
                    if (res.data && res.data.controllerLayers) {
                        for (let i = 0; i < res.data.controllerLayers.length; i++) {
                            let layer = res.data.controllerLayers[i];
                            for (let j = 0; j < layer.states.length; j++) {
                                let state = layer.states[j];
                                if (state.clip && state.clip instanceof AnimationClip) {
                                    state.clip._addReference()
                                }
                            }
                        }
                    }
                }
                res._addReference();
                this._deps.push(res);

                if (!LayaEnv.isPlaying && (res instanceof Prefab))
                    res.on("obsolute", this, this.onDepObsolute);
            }
        }
    }

    protected _disposeResource(): void {
        for (let res of this._deps) {
            if (res instanceof AnimatorController) {
                if (res.data && res.data.controllerLayers) {
                    for (let i = 0; i < res.data.controllerLayers.length; i++) {
                        let layer = res.data.controllerLayers[i];
                        for (let j = 0; j < layer.states.length; j++) {
                            let state = layer.states[j];
                            if (state.clip && state.clip instanceof AnimationClip) {
                                state.clip._removeReference()
                            }
                        }
                    }
                }
            }
            res._removeReference();

            if (!LayaEnv.isPlaying && (res instanceof Prefab))
                res.off("obsolute", this, this.onDepObsolute);
        }
    }

    public get obsolute(): boolean {
        return this._obsolute;
    }

    public set obsolute(value: boolean) {
        if (this._obsolute != value) {
            this._obsolute = value;
            if (value && !LayaEnv.isPlaying)
                this.event("obsolute");
        }
    }

    private onDepObsolute() {
        this.obsolute = true;
    }
}

//旧版本兼容
export type HierarchyResource = Prefab;
export var HierarchyResource = Prefab;