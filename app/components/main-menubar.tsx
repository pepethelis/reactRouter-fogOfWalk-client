import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarRadioGroup,
	MenubarRadioItem,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from "~/components/ui/menubar";
import { type FogStyle, fogStyles, type MapStyle, mapStyles } from "./map";

type MainMenubarProps = {
	fogOpacity: number;
	mapStyle: MapStyle;
	fogStyle: FogStyle;
	setFogOpacity: (value: number) => void;
	setMapStyle: (value: MapStyle) => void;
	setFogStyle: (value: FogStyle) => void;
	onSelectFilesClick: () => void;
	onClearTracksClick: () => void;
};

export function MainMenubar({
	fogOpacity,
	mapStyle,
	fogStyle,
	setFogOpacity,
	setMapStyle,
	setFogStyle,
	onClearTracksClick,
	onSelectFilesClick,
}: MainMenubarProps) {
	const handleMapStyleChange = (value: MapStyle) => {
	if (fogStyle === "inverted" && value === "satelite") {
		setFogStyle("classic");
	}
		setMapStyle(value);
	};

	const handleFogOpacityChange = (value: string) => {
		const opacity = parseFloat(value);
		setFogOpacity(opacity);
		if (opacity < 0.5) {
			setFogStyle("classic");
		}
	};

	const handleFogStyleChange = (value: FogStyle) => {
		if (value === "inverted" && mapStyle === "satelite") {
			setMapStyle("light");
		}
		setFogStyle(value);
	};

	return (
		<Menubar className="absolute top-4 left-4 z-10">
			<MenubarMenu>
				<MenubarTrigger>File</MenubarTrigger>
				<MenubarContent>
					<MenubarItem onClick={onSelectFilesClick}>
						Add other tracks
					</MenubarItem>
					<MenubarItem onClick={onClearTracksClick}>Clear tracks</MenubarItem>
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>View</MenubarTrigger>
				<MenubarContent>
					<MenubarSub>
						<MenubarSubTrigger>Fog opacity</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarRadioGroup
								value={fogOpacity.toString()}
								onValueChange={handleFogOpacityChange}
							>
								<MenubarRadioItem value="0">Hidden</MenubarRadioItem>
								<MenubarRadioItem value="0.3">30%</MenubarRadioItem>
								<MenubarRadioItem value="0.5">50%</MenubarRadioItem>
								<MenubarRadioItem value="0.7">70%</MenubarRadioItem>
								<MenubarRadioItem value="0.8">80%</MenubarRadioItem>
							</MenubarRadioGroup>
						</MenubarSubContent>
					</MenubarSub>
					<MenubarSub>
						<MenubarSubTrigger>Map style</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarRadioGroup
								value={mapStyle}
								onValueChange={(value) =>
									handleMapStyleChange(value as MapStyle)
								}
							>
								{mapStyles.map((style) => (
									<MenubarRadioItem key={style} value={style}>
										{style}
									</MenubarRadioItem>
								))}
							</MenubarRadioGroup>
						</MenubarSubContent>
					</MenubarSub>
					<MenubarSub>
						<MenubarSubTrigger>Fog style</MenubarSubTrigger>
						<MenubarSubContent>
							<MenubarRadioGroup
								value={fogStyle}
								onValueChange={(value) => handleFogStyleChange(value as FogStyle)}
							>
								{fogStyles.map((style) => (
									<MenubarRadioItem
										key={style}
										value={style}
									>
										{style}
									</MenubarRadioItem>
								))}
							</MenubarRadioGroup>
						</MenubarSubContent>
					</MenubarSub>
				</MenubarContent>
			</MenubarMenu>
		</Menubar>
	);
}
