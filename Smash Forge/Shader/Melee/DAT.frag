#version 330

in vec3 objectPosition;
in vec3 normal;
in vec3 bitangent;
in vec3 tangent;
in vec4 color;
in vec2 UV0;

uniform int hasSphere;

uniform int hasDiffuse0;
uniform sampler2D diffuseTex0;
uniform vec2 diffuseScale0;

uniform int hasDiffuse1;
uniform sampler2D diffuseTex1;
uniform vec2 diffuseScale1;

uniform int hasSpecular;
uniform sampler2D specularTex;
uniform vec2 specularScale;

uniform int hasBumpMap;
uniform int bumpMapWidth;
uniform int bumpMapHeight;
uniform sampler2D bumpMapTex;
uniform vec2 bumpMapTexScale;

uniform vec4 diffuseColor;
uniform vec4 ambientColor;
uniform vec4 specularColor;

uniform int flags;
uniform int enableSpecular;
uniform int enableDiffuseLighting;

uniform float glossiness;
uniform float transparency;

uniform int colorOverride;

uniform mat4 mvpMatrix;
uniform mat4 sphereMatrix;

uniform int renderDiffuse;
uniform int renderSpecular;

uniform int renderAlpha;

uniform int renderNormalMap;

out vec4 fragColor;


// Defined in MeleeUtils.frag
vec3 CalculateBumpMapNormal(vec3 normal, vec3 tangent, vec3 bitangent,
    int hasBump, sampler2D bumpMap, int width, int height, vec2 texCoords);

void main()
{
	if (colorOverride == 1)
	{
		fragColor = vec4(1);
		return;
	}

	fragColor = vec4(0, 0, 0, 1);

	vec3 V = vec3(0, 0, -1) * mat3(mvpMatrix);
    vec3 N = normal;
    if (renderNormalMap == 1)
    {
        // This seems to only affect diffuse.
        N = CalculateBumpMapNormal(normal, tangent, bitangent, hasBumpMap,
            bumpMapTex, bumpMapWidth, bumpMapHeight, UV0  * bumpMapTexScale);
    }

	// Diffuse
    float blend = 0.1; // TODO: Use texture's blend.
	float lambert = clamp(dot(N, V), 0, 1);
	vec4 diffuseMap = vec4(1);
    vec2 diffuseCoords = UV0;
	if (hasSphere == 1)
	{
		vec3 viewNormal = mat3(sphereMatrix) * normal.xyz;
		diffuseCoords = viewNormal.xy * 0.5 + 0.5;
	}

    // TODO: Either texture can be a sphere map.
    if (hasDiffuse0 == 1)
        diffuseMap = texture(diffuseTex0, UV0 * diffuseScale0).rgba;
    if (hasDiffuse1 == 1)
        diffuseMap = mix(diffuseMap, texture(diffuseTex1, diffuseCoords * diffuseScale1), blend);

	vec3 diffuseTerm = diffuseMap.rgb;
	if (enableDiffuseLighting == 1)
	 	diffuseTerm *= mix(ambientColor.rgb, diffuseColor.rgb, lambert);

	// Specular
	float phong = clamp(dot(normal, V), 0, 1);
	phong = pow(phong, glossiness);
	vec3 specularTerm = vec3(phong) * specularColor.rgb;
    if (hasSpecular == 1)
        specularTerm *= texture(specularTex, UV0 * specularScale).rgb;
	specularTerm *= enableSpecular;

	// Render passes
	fragColor.rgb += diffuseTerm * renderDiffuse;
	fragColor.rgb += specularTerm * renderSpecular;

	// Set alpha
    if (renderAlpha == 1)
        fragColor.a = diffuseMap.a * transparency;
}
